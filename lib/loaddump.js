var update = require('./update');
var entity = require('./entity');
var loadTemplate = require('./loadtemplate');
var winston = require('winston');
var jsonfile = require('jsonfile');
var path = require('path');
var async = require('async');

function loadEntity(db, parsedData, entityPath, next) {
  var ent = new entity.Entity();
  ent.fromDb({rows: [parsedData]});
  if (entityPath) {
    ent._path = entityPath;
  }
  update.createEntity(db, {}, {context: 'ROOT'}, ent, true,
    'loaded via rm3load', function(err, entityId, revisionId, revisionNum) {
      if (err) {
        next(err);
      }
      winston.info('Created ', {entityId: entityId, revisionId: revisionId, revisionNum: revisionNum});
      next(undefined);
    });
}

function loadFromCatalog(db, catalogPath, entityPath, userPath, next) {
  var catalog = jsonfile.readFileSync(path.join(catalogPath, 'catalog.json'));
  console.log(catalog);
  async.series([
    function(callback) {
      winston.info('Loading nodes');
      async.forEachOf(catalog, function(value, key, callback) {
        if (!key.startsWith('_')) {
          var inPath = path.join(catalogPath, value.main);
          loadEntity(db, jsonfile.readFileSync(inPath), null, callback);
        } else {
          callback();
        }
      }, callback);
    },
    function(callback) {
      winston.info('Loading permissions');
      if (catalog._permissions) {
        var permissionsPath = path.join(catalogPath, catalog._permissions);
        loadTemplate(db, entity.Entity, update,
          jsonfile.readFileSync(permissionsPath), entityPath, userPath, callback);
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
      }
    }
  ],
  function(err) {
    next(err);
  });
}

exports.loadEntity = loadEntity;
exports.loadFromCatalog = loadFromCatalog;
