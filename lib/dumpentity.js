var query = require('./query');
var async = require('async');

var dumpEntity = function(db, entity, path, history, callback) {
  async.waterfall([
    function queryEnt(callback) {
      query.entityFromPath(db, entity, {}, {context: 'ROOT'}, path, null, callback);
    },
    function queryHist(ent, callback) {
      if (history) {
        var resp = query.queryHistory(db, {}, {context: 'ROOT'}, ent._path, null, {});
        var arts = [];
        resp.on('article', function(article) {
          arts.push(article);
        });
        resp.on('error', function(err) {
          callback(err);
        });
        resp.on('end', function() {
          callback(null, ent, arts);
        });
      } else {
        callback(null, ent, undefined);
      }
    },
    function queryBlobs(ent, log, callback) {
      var resp = query.listBlobs(db, {}, ent._path.toDottedPath(), true);
      var arts = [];
      resp.on('article', function(article) {
        arts.push(article);
      });
      resp.on('error', function(err) {
        callback(err);
      });
      resp.on('end', function() {
        callback(null, ent, log, arts);
      });
    }
  ], callback);
};

exports = module.exports = dumpEntity;
