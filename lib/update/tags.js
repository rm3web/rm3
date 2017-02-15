var async = require('async');
var squel = require("squel").useFlavour('postgres'),
    sql = require('../sql');
var logging = require('../logging');
var LinkedDataBox = require('linked-data-box').LinkedDataBox;

var boundLogger = logging.getRootLogger('update.tags');

exports.clearTags = function clearTags(ctx, exec, client, done, logentry, callback) {
  boundLogger.info('clearTags', {
    ctx: ctx,
    path: logentry.path,
    exec: exec
  });
  if (!exec) {
    return callback(null, client, done, logentry);
  }

  var path = logentry.path;
  var s = squel.remove().from('wh_tag');
  s.where("\"subjPath\" = ?", path);
  var q = s.toParam();
  q.name = 'clear_tags';
  client.query(q, function(err, result) {
    if (err) {
      return callback(err);
    }
    s = squel.remove().from('wh_geotag');
    s.where("\"subjPath\" = ?", path);
    q = s.toParam();
    q.name = 'clear_geotags';
    client.query(q, function(err, result) {
      callback(err, client, done, logentry);
    });
  });
};

function generateOneTagInsert(subjPath, predKey, objKey, objClass, obj) {
  var s, q;
  if (objClass === 'geo') {
    s = squel.insert().into('wh_geotag');
    sql.setFields(s, {
      "\"subjPath\"": subjPath,
      "\"objClass\"": objClass,
      "\"predPath\"": predKey,
      "\"objStr\"": objKey
    });
    q = s.toParam();
    q.name = 'insert_tag_query';
    return q;
  } else {
    s = squel.insert().into('wh_tag');
    sql.setFields(s, {
      "\"subjPath\"": subjPath,
      "\"objClass\"": objClass,
      "\"predPath\"": predKey,
      "\"objStr\"": objKey
    });
    q = s.toParam();
    q.name = 'insert_tag_query';
    return q;
  }
}

exports.writeTags = function writeTags(ctx, exec, client, done, logentry, callback) {
  boundLogger.info('writeTags', {
    ctx: ctx,
    path: logentry.path,
    exec: exec
  });
  if (!exec) {
    return callback(null, client, done, logentry);
  }

  var path = logentry.path;
  var toData = logentry.data.toData;
  if (logentry.evtClass === 'Move') {
    path = logentry.data.toPath;
    toData = logentry.data.fromData;
  }
  var queries = [];
  if (toData) {
    if (toData.hasOwnProperty('tags')) {
      var tagBox = new LinkedDataBox(toData.tags);
      tagBox.iterateTags(function(pred, tag, idx) {
        if (!tag.noIndex) {
          queries.push(
            generateOneTagInsert(path, pred, tag['@id'], tag.objClass, tag));
        }
      });
    }
  }

  async.each(queries, function(item, callback) {
    return client.query(item, callback);
  }, function(err) {
    return callback(err, client, done, logentry);
  });
};
