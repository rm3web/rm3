var update = require('./update');
var entity = require('./entity');
var loadTemplate = require('./loadtemplate');
var winston = require('winston');
var jsonfile = require('jsonfile');
var path = require('path');
var async = require('async');
var fs = require('fs');
var Conf = require('../lib/conf'),
    BlobStores = require('../lib/blobstores'),
    FileBlobStore = require('../lib/fileblobstore');
var Protoset = require('./protoset');
var SitePath = require('sitepath');

function loadEntityWithHistory(db, security, ent, history, preserveEntityId, next) {
  if (history) {
    winston.info('Creating ', {entityId: ent._entityId});
    async.forEachOfSeries(history, function(entry, key, callback) {
      winston.info('Forging ', {entityId: ent._entityId,
        revisionId: entry.revisionId, revisionNum: entry.revisionNum, num: key,
        length: history.length});
      entry.path = new SitePath(entry.path).toDottedPath();
      if (entry.actorPath) {
        entry.actorPath = new SitePath(entry.actorPath);
      }
      update.forgeLogentry(db, {}, security, entry, true, callback);
    }, function(err) {
      next(err);
    });
  } else {
    update.loadEntity(db, {}, security, ent, true,
      'loaded via rm3load', preserveEntityId, function(err, entityId, revisionId, revisionNum) {
        if (err) {
          return next(err);
        }
        winston.info('Created ', {entityId: entityId, revisionId: revisionId, revisionNum: revisionNum});
        next(err);
      });
  }
}

function loadEntity(db, parsedData, entityPath, preserveEntityId, loadHistory, revisions, next) {
  var ent = new entity.Entity();
  if (!parsedData.hasOwnProperty('hidden')) {
    parsedData.hidden = false;
  }
  ent.fromDb({rows: [parsedData]});
  if (entityPath) {
    ent._path = entityPath;
  }
  var page = Protoset.getPage(ent._proto);
  if (page.preCreate) {
    page.preCreate(ent);
  }
  var history;
  if (loadHistory) {
    history = parsedData.history;
  }
  loadEntityWithHistory(db, {context: 'ROOT'}, ent, history, preserveEntityId,
    function(err, entityId, revisionId, revisionNum) {
      if (err) {
        next(err);
      }
      if (page.postCreate) {
        async.forEachOf(revisions, function(key, value, callback) {
          page.postCreate({}, ent, value, callback);
        }, next);
      } else {
        next(undefined);
      }
    });
}

function loadBlobs(catalog, store, catalogPath, next) {
  winston.info('Loading blobs');
  var revisions = {};
  async.forEachOf(catalog.blobs, function(value, key, callback) {
    var filepath = path.join(catalogPath, key);
    fs.readFile(filepath, function(err, data) {
      if (err) {
        return callback(err);
      }
      winston.info('Loading blob:', key);
      revisions[value.revisionId] = true;
      var categoryStore = BlobStores.getBlobStore(value.category);
      categoryStore.addBlob({}, value.entityPath, value.blobPath, value.revisionId, value.source,
        value.temporary, data, function(err) {
          if (err) {
            return callback(err);
          }
          callback();
        });
    });
  }, function(err) {
    if (err) {
      return next(err);
    }
    next(null, revisions);
  });
}

function loadEntities(db, catalog, catalogPath, loadHistory, next) {
  var conf = {
    path: Conf.getPath('localBlobs'),
    urlroot: '/blobs/',
    category: 'public'
  };
  var store = BlobStores.register('public', new FileBlobStore(conf, db));

  winston.info('Loading nodes');
  async.forEachOf(catalog, function(value, key, callback) {
    if (!key.startsWith('_')) {
      var inPath = path.join(catalogPath, value.main);
      async.waterfall([
        function(callback) {
          if (value.blobs) {
            loadBlobs(value, store, catalogPath, callback);
          } else {
            callback(null, {});
          }
        },
        loadEntity.bind(this, db, jsonfile.readFileSync(inPath), null, true, loadHistory)
      ], callback);
    } else {
      callback();
    }
  }, next);
}

function loadFromCatalog(db, catalogPath, entityPath, userPath, loadHistory, next) {
  var catalog = jsonfile.readFileSync(path.join(catalogPath, 'catalog.json'));
  async.series([
    loadEntities.bind(this, db, catalog, catalogPath, loadHistory),
    function(callback) {
      winston.info('Loading permissions');
      if (catalog._permissions) {
        var permissionsPath = path.join(catalogPath, catalog._permissions);
        loadTemplate(db, entity.Entity, update,
          jsonfile.readFileSync(permissionsPath), entityPath, userPath, callback);
      } else {
        callback();
      }
    },
    function(callback) {
      winston.info('Loading credentials');
      if (catalog._credentials) {
        var credentialsPath = path.join(catalogPath, catalog._credentials);
        var credentials = jsonfile.readFileSync(credentialsPath);
        async.each(credentials, function(item, next) {
          update.createCredential(db, {}, item.provider, item.userId, item.userPath, item.providerDetails, next);
        }, callback);
      } else {
        callback();
      }
    }
  ],
  function(err) {
    next(err);
  });
}

exports.loadEntity = loadEntity;
exports.loadFromCatalog = loadFromCatalog;
