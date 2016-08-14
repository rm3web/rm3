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

function loadEntity(db, parsedData, entityPath, preserveEntityId, revisions, next) {
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
  update.loadEntity(db, {}, {context: 'ROOT'}, ent, true,
    'loaded via rm3load', preserveEntityId, function(err, entityId, revisionId, revisionNum) {
      if (err) {
        next(err);
      }
      winston.info('Created ', {entityId: entityId, revisionId: revisionId, revisionNum: revisionNum});
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

function loadEntities(db, catalog, catalogPath, next) {
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
        loadEntity.bind(this, db, jsonfile.readFileSync(inPath), null, true)
      ], callback);
    } else {
      callback();
    }
  }, next);
}

function loadFromCatalog(db, catalogPath, entityPath, userPath, next) {
  var catalog = jsonfile.readFileSync(path.join(catalogPath, 'catalog.json'));
  async.series([
    loadEntities.bind(this, db, catalog, catalogPath),
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
