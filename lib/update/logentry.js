var util = require('util'),
    errs = require('errs');
var squel = require("squel").useFlavour('postgres'),
    sql = require('../sql');
var logging = require('../logging');
var states = require('../states');

squel.registerValueHandler(Date, function(date) {
  // The pg driver lets us send raw dates
  return date;
});

var boundLogger = logging.getRootLogger('update.logentry');

function InvalidLogClass() {
  this.message = "evt_class in log entry doesn't match anything we expect";
}
util.inherits(InvalidLogClass, Error);
errs.register('update.logentry.bad_evtClass', InvalidLogClass);

exports.writeLogentry = function writeLogentry(ctx, client, done, logentry, callback) {
  boundLogger.info('writeLogentry', {
    ctx: ctx
  });
  var s = squel.insert().into('wh_log');
  sql.setFields(s, {
    "path": logentry.path,
    "\"entityId\"": logentry.entityId,
    "note": logentry.note,
    "\"baseRevisionId\"": logentry.baseRevisionId,
    "\"replaceRevisionId\"": logentry.replaceRevisionId,
    "\"revisionId\"": logentry.revisionId,
    "\"revisionNum\"": logentry.revisionNum,
    "\"evtStart\"": logentry.evtStart,
    "\"evtEnd\"": logentry.evtEnd,
    "\"evtTouched\"": logentry.evtTouched,
    "\"evtClass\"": logentry.evtClass,
    "\"evtFinal\"": logentry.evtFinal,
    "\"actorPath\"": logentry.actorPath,
    "workflow": JSON.stringify(logentry.workflow),
    "data": JSON.stringify(logentry.data)
  });
  var q = s.toParam();
  q.name = 'insert_log_query';
  client.query(q, function(err, result) {
    callback(err, client, done, logentry);
  });
};

exports.updateLogentry = function updateLogentry(ctx, client, done, logentry, callback) {
  boundLogger.info('updateLogentry', {
    ctx: ctx
  });
  var s = squel.update().table('wh_log');
  sql.setFields(s, {
    "path": logentry.path,
    "\"entityId\"": logentry.entityId,
    "note": logentry.note,
    "\"baseRevisionId\"": logentry.baseRevisionId,
    "\"replaceRevisionId\"": logentry.replaceRevisionId,
    "\"revisionNum\"": logentry.revisionNum,
    "\"evtStart\"": logentry.evtStart,
    "\"evtEnd\"": logentry.evtEnd,
    "\"evtTouched\"": logentry.evtTouched,
    "\"evtClass\"": logentry.evtClass,
    "\"evtFinal\"": logentry.evtFinal,
    "\"actorPath\"": logentry.actorPath,
    "workflow": JSON.stringify(logentry.workflow),
    "data": JSON.stringify(logentry.data)
  });
  s.where("\"revisionId\" = ?", logentry.revisionId);
  var q = s.toParam();
  q.name = 'update_log_query';
  client.query(q, function(err, result) {
    callback(err, client, done, logentry);
  });
};

exports.execLogentry = function execLogentry(ctx, exec, client, done, logentry, callback) {
  boundLogger.info('execLogentry begin', {
    ctx: ctx,
    evtClass: logentry.evtClass,
    exec: exec
  });
  var s, q;
  if (!exec) {
    return callback(null, client, done, logentry);
  }
  states.publishWorkflow.publishDraft(logentry.workflow);
  var now = new Date();
  if (logentry.evtClass === 'Create') {
    var ds = squel.remove().from('wh_entity');
    ds.where("path = ?", logentry.path);
    ds.where("stub = true");
    var dq = ds.toParam();
    dq.name = 'insert_entity_query_delete';

    s = squel.insert().into('wh_entity');
    sql.setFields(s, {
      "path": logentry.path,
      "stub": false,
      "\"entityId\"": logentry.entityId,
      "\"revisionId\"": logentry.revisionId,
      "\"revisionNum\"": logentry.revisionNum,
      "proto": logentry.data.toData.proto,
      "modified": logentry.data.toData.modified,
      "created": logentry.data.toData.created,
      "touched": logentry.evtTouched,
      "hidden": logentry.data.toData.hidden,
      "summary": JSON.stringify(logentry.data.toData.summary),
      "data": JSON.stringify(logentry.data.toData.data),
      "tags": JSON.stringify(logentry.data.toData.tags)
    });
    if (logentry.data.toData.fullTextString) {
      s.set('search', squel.str('to_tsvector(\'english\', ?)', logentry.data.toData.fullTextString));
    } else {
      s.set('search', squel.str('to_tsvector(\'english\', ?)', ''));
    }
    q = s.toParam();
    q.name = 'insert_entity_query';

    client.query(dq, function(err, result) {
      if (err) {
        return callback(err, client, done, logentry);
      }
      client.query(q, function(err, result) {
        if (!err) {
          logentry.evtFinal = true;
          logentry.evtEnd = now;
        }
        callback(err, client, done, logentry);
      });
    });
  } else if (logentry.evtClass === 'Update') {
    s = squel.update().table('wh_entity');
    sql.setFields(s, {
      "stub": false,
      "\"entityId\"": logentry.entityId,
      "\"revisionId\"": logentry.revisionId,
      "\"revisionNum\"": logentry.revisionNum,
      "proto": logentry.data.toData.proto,
      "modified": logentry.data.toData.modified,
      "created": logentry.data.toData.created,
      "touched": logentry.evtTouched,
      "hidden": logentry.data.toData.hidden,
      "summary": JSON.stringify(logentry.data.toData.summary),
      "data": JSON.stringify(logentry.data.toData.data),
      "tags": JSON.stringify(logentry.data.toData.tags)
    });
    if (logentry.data.toData.fullTextString) {
      s.set('search', squel.str('to_tsvector(\'english\', ?)', logentry.data.toData.fullTextString));
    } else {
      s.set('search', squel.str('to_tsvector(\'english\', ?)', ''));
    }
    s.where("path = ?", logentry.path);
    q = s.toParam();
    q.name = 'update_entity_query';

    client.query(q, function(err, result) {
      if (!err) {
        logentry.evtFinal = true;
        logentry.evtEnd = now;
      }
      callback(err, client, done, logentry);
    });
  } else if (logentry.evtClass === 'Delete') {
    s = squel.update().table('wh_entity');
    sql.setFields(s, {
      "stub": true,
      "\"entityId\"": logentry.entityId,
      "\"revisionId\"": logentry.revisionId,
      "\"revisionNum\"": logentry.revisionNum,
      "proto": null,
      "modified": logentry.evtTouched,
      "created": logentry.data.fromData.created,
      "touched": logentry.evtTouched,
      "summary": JSON.stringify({'deleted': true}),
      "data": JSON.stringify({}),
      "tags": JSON.stringify({})
    });
    s.where("path = ?", logentry.path);
    q = s.toParam();
    q.name = 'delete_entity_query';
    client.query(q, function(err, result) {
      if (!err) {
        logentry.evtFinal = true;
        logentry.evtEnd = now;
      }
      callback(err, client, done, logentry);
    });
  } else if (logentry.evtClass === 'Move') {
    s = squel.update().table('wh_entity');
    sql.setFields(s, {
      "path": logentry.data.toPath,
      "\"revisionId\"": logentry.revisionId,
      "\"revisionNum\"": logentry.revisionNum
    });
    s.where("path = ?", logentry.path);
    q = s.toParam();
    q.name = 'move_entity_query';
    client.query(q, function(err, result) {
      if (!err) {
        logentry.evtFinal = true;
        logentry.evtEnd = now;
      }
      callback(err, client, done, logentry);
    });
  } else if (logentry.evtClass === 'rm3:assign') {
    s = squel.insert().into('wh_subject_to_roles');
    sql.setFields(s, {
      "subject": logentry.path,
      "role": logentry.data.role
    });
    q = s.toParam();
    q.name = 'assign_subject_to_role';
    client.query(q, function(err, result) {
      if (!err) {
        logentry.evtFinal = true;
        logentry.evtEnd = now;
      }
      callback(err, client, done, logentry);
    });
  } else if (logentry.evtClass === 'rm3:deassign') {
    s = squel.remove().from('wh_subject_to_roles');
    s.where("subject = ?", logentry.path);
    s.where("role = ?", logentry.data.role);
    q = s.toParam();
    q.name = 'remove_user_from_role';
    client.query(q, function(err, result) {
      if (!err) {
        logentry.evtFinal = true;
        logentry.evtEnd = now;
      }
      callback(err, client, done, logentry);
    });
  } else if (logentry.evtClass === 'rm3:permit') {
    s = squel.insert().into('wh_permission_to_role');
    sql.setFields(s, {
      "path": logentry.data.path,
      "role": logentry.data.role,
      "permission": logentry.data.permission,
      "query": logentry.data.path
    });
    q = s.toParam();
    q.name = 'add_permission_to_role';
    client.query(q, function(err, result) {
      if (!err) {
        logentry.evtFinal = true;
        logentry.evtEnd = now;
      }
      callback(err, client, done, logentry);
    });
  } else if (logentry.evtClass === 'rm3:deny') {
    s = squel.remove().from('wh_permission_to_role');
    s.where("path = ?", logentry.data.path);
    s.where("role = ?", logentry.data.role);
    s.where("permission = ?", logentry.data.permission);
    q = s.toParam();
    q.name = 'remove_permission_from_role';
    client.query(q, function(err, result) {
      if (!err) {
        logentry.evtFinal = true;
        logentry.evtEnd = now;
      }
      callback(err, client, done, logentry);
    });
  } else {
    var err = errs.create('update.logentry.bad_evtClass', {evtClass: logentry.evtClass});
    callback(err, client, done, logentry);
  }
};
