var sitepath = require ('./sitepath');
var uuid = require('node-uuid');
var async = require('async');
var util = require('util'),
    errs = require('errs');
var read_logentry = require('./query')._read_logentry;
var squel = require("squel"),
    sql = require('./sql');
squel.useFlavour('postgres');
squel.registerValueHandler(Date, function(date) {
  // The pg driver lets us send raw dates, 
  return date;
});
/**
* @overview These are the update operations that take raw operations (create entity, delete
* entity, update entity, store revision, etc) and persist them to the DB.
* @title Update operations
* @module update
*/


function InvalidLogClass() {
  this.message = "evt_class in log entry doesn't match anything we expect";
}
util.inherits(InvalidLogClass, Error);
errs.register('update.bad_evtClass', InvalidLogClass);

function post_commit_err(db, client, err, done, next) {
  var wrappedError = db.wrapError(err);
  db.rollbackTransaction(client, function(err) {
    if (err) {
      console.error('REALLY BAD ERROR ROLLING BACK', err);
    }
    done(wrappedError);
    return next(wrappedError);
  });
}

function write_logentry(client, done, logentry, callback) {
  var s = squel.insert().into('wh_log');
  sql.set_fields(s, {
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
    "data": JSON.stringify(logentry.data)
  });
  var q = s.toParam();
  q.name = 'insert_log_query';
  client.query(q, function(err, result){
    callback(err, client, done, logentry);
  });
}

function update_logentry(client, done, logentry, callback) {
  var s = squel.update().table('wh_log');
  sql.set_fields(s, {
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
    "data": JSON.stringify(logentry.data)
  });
  s.where("\"revisionId\" = ?", logentry.revisionId);
  var q = s.toParam();
  q.name = 'update_log_query';
  client.query(q, function(err, result){
    callback(err, client, done, logentry);
  });
}

function exec_logentry(exec, client, done, logentry, callback) {
  var s, q;
  if (!exec) {
    return callback(null, client, done, logentry);
  }
  var now = new Date();
  if (logentry.evtClass === 'create') {
    s = squel.insert().into('wh_entity');
    sql.set_fields(s, {
      "path": logentry.path,
      "stub": false,
      "\"entityId\"": logentry.entityId,
      "\"revisionId\"": logentry.revisionId,
      "\"revisionNum\"": logentry.revisionNum,
      "proto": logentry.data.toData.proto,
      "modified": logentry.data.toData.modified,
      "created": logentry.data.toData.created,
      "summary": JSON.stringify(logentry.data.toData.summary),
      "data": JSON.stringify(logentry.data.toData.data),
      "tags": JSON.stringify(logentry.data.toData.tags)
    });
    q = s.toParam();
    q.name = 'insert_entity_query';

    client.query(q, function(err, result){
      if (!err) {
        logentry.evtFinal = true;
        logentry.evtEnd = now;
      }
      callback(err, client, done, logentry);
    });
  } else if (logentry.evtClass === 'update') {
    s = squel.update().table('wh_entity');
    sql.set_fields(s, {
      "stub": false,
      "\"entityId\"": logentry.entityId,
      "\"revisionId\"": logentry.revisionId,
      "\"revisionNum\"": logentry.revisionNum,
      "proto": logentry.data.toData.proto,
      "modified": logentry.data.toData.modified,
      "created": logentry.data.toData.created,
      "summary": JSON.stringify(logentry.data.toData.summary),
      "data": JSON.stringify(logentry.data.toData.data),
      "tags": JSON.stringify(logentry.data.toData.tags)
    });
    s.where("path = ?", logentry.path);
    q = s.toParam();
    q.name = 'update_entity_query';

    client.query(q, function(err, result){
      if (!err) {
        logentry.evtFinal = true;
        logentry.evtEnd = now;
      }
      callback(err, client, done, logentry);
    });
  } else if (logentry.evtClass === 'delete') {
    s = squel.remove().from('wh_entity');
    s.where("path = ?", logentry.path);
    q = s.toParam();
    q.name = 'delete_entity_query';
    client.query(q, function(err, result){
      if (!err) {
        logentry.evtFinal = true;
        logentry.evtEnd = now;
      }
      callback(err, client, done, logentry);
    });
  } else if (logentry.evtClass === 'move') {
    s = squel.update().table('wh_entity');
    sql.set_fields(s, {
      "path": logentry.data.toPath,
      "\"revisionId\"": logentry.revisionId,
      "\"revisionNum\"": logentry.revisionNum,
    });
    s.where("path = ?", logentry.path);
    q = s.toParam();
    q.name = 'move_entity_query';
    client.query(q, function(err, result){
      if (!err) {
        logentry.evtFinal = true;
        logentry.evtEnd = now;
      }
      callback(err, client, done, logentry);
    });
  } else if (logentry.evtClass === 'assign') {
    s = squel.insert().into('wh_subject_to_roles');
    sql.set_fields(s, {
      "subject": logentry.path,
      "role": logentry.data.role
    });
    q = s.toParam();
    q.name = 'assign_subject_to_role';
    client.query(q, function(err, result){
      if (!err) {
        logentry.evtFinal = true;
        logentry.evtEnd = now;
      }
      callback(err, client, done, logentry);
    });
  } else if (logentry.evtClass === 'deassign') {
    s = squel.remove().from('wh_subject_to_roles');
    s.where("subject = ?", logentry.path);
    s.where("role = ?", logentry.data.role);
    q = s.toParam();
    q.name = 'remove_user_from_role';
    client.query(q, function(err, result){
      if (!err) {
        logentry.evtFinal = true;
        logentry.evtEnd = now;
      }
      callback(err, client, done, logentry);
    });
  } else if (logentry.evtClass === 'permit') {
    s = squel.insert().into('wh_permission_to_role');
    sql.set_fields(s, {
      "path": logentry.data.path,
      "role": logentry.data.role,
      "permission": logentry.data.permission,
      "query": logentry.data.path
    });
    q = s.toParam();
    q.name = 'add_permission_to_role';
    client.query(q, function(err, result){
      if (!err) {
        logentry.evtFinal = true;
        logentry.evtEnd = now;
      }
      callback(err, client, done, logentry);
    });
  } else if (logentry.evtClass === 'deny') {
    s = squel.remove().from('wh_permission_to_role');
    s.where("path = ?", logentry.data.path);
    s.where("role = ?", logentry.data.role);
    s.where("permission = ?", logentry.data.permission);
    q = s.toParam();
    q.name = 'remove_permission_from_role';
    client.query(q, function(err, result){
      if (!err) {
        logentry.evtFinal = true;
        logentry.evtEnd = now;
      }
      callback(err, client, done, logentry);
    });
  } else {
    var err = errs.create('update.bad_evtClass', {evt_class: logentry.evtClass });
    callback(err, client, done, logentry);
  }
}

exports._private = {};
exports._private.exec_logentry = exec_logentry;

function commit(db, client, done, logentry, callback) {
  db.commitTransaction(client, function commit_func(err) {
    callback(err, client, done, logentry);
  });
}

function do_cleanup(db, next, err, client, done, logentry) {
  if (err) {
    return post_commit_err(db, client, err, done, next);
  }
  done(err);
  return next(err, logentry.entityId, logentry.revisionId, logentry.revisionNum);
}

function clear_tags(exec, client, done, logentry, callback) {
  if (!exec) {
    return callback(null, client, done, logentry);
  }
  
  var path = logentry.path;
  var s = squel.remove().from('wh_tag');
  s.where("\"subjPath\" = ?", path);
  var q = s.toParam();
  q.name = 'clear_tags';
  client.query(q, function(err, result){
    callback(err, client, done, logentry);
  });
}

function generate_one_tag_insert(subjPath, predClass, predKey, objKey, obj) {
  var s = squel.insert().into('wh_tag');
    sql.set_fields(s, {
      "\"subjPath\"": subjPath,
      "\"predClass\"": predClass,
      "\"predPath\"": predKey,
      "\"objStr\"": objKey,
    });
  var q = s.toParam();
  q.name = 'insert_tag_query';
  return q;
}

function write_tags(exec, client, done, logentry, callback) {
  if (!exec) {
    return callback(null, client, done, logentry);
  }

  var path = logentry.path;
  var toData = logentry.data.toData;
  if (logentry.evtClass === 'move') {
    path = logentry.data.toPath;
    toData = logentry.data.fromData;
  }
  var queries = [];
  if (toData) {
    if (toData.hasOwnProperty('tags')) {
      for (var predKey in toData.tags) {
        if (toData.tags.hasOwnProperty(predKey)) {
          var pred = toData.tags[predKey];
          for (var objKey in pred) {
            var obj = pred[objKey];
            var predClass = obj.predClass;
            queries.push(
              generate_one_tag_insert(path, predClass, predKey, objKey, obj));
          }
        }
      }
    }
  }

  async.each(queries, function(item, callback){
    return client.query(item, callback);
  }, function(err) {
    return callback(err, client, done, logentry);
  });
}


/**
  This creates a new entity
  @param {Object} db DB wrapper
  @param {Entity} entity Entity to be created
  @param {Boolean} exec true to make the transaction final, false to store it provisionally
  @param {String} note Comment to be added to the log
  @param {*} next Function that takes(err, entityId, revision_id, revision_num)
*/
exports.create_entity = function(db, entity, exec, note, next) {
  async.waterfall([
    db.connectWrap,
    db.openTransaction,
    function generate_logentry(client, done, callback) {
      var now = new Date();
      var path = entity._path.toDottedPath();
      var entityId = uuid.v1();
      var logentry = {
        path: path,
        entityId: entityId, 
        note: note,
        baseRevisionId: null,
        replaceRevisionId: null,
        revisionId: uuid.v1(), 
        revisionNum: 1,
        evtStart: now,
        evtEnd: null,
        evtTouched: now,
        evtClass: 'create',
        evtFinal: false,
        data: {
          toData: entity.toLog(entityId)
        }
      };
      callback(null, client, done, logentry);
    },
    exec_logentry.bind(this,exec),
    write_tags.bind(this,exec),
    write_logentry,
    commit.bind(this,db)
  ], do_cleanup.bind(this,db,next));
};

/**
  This updates an existing entity
  @param {Object} db DB wrapper
  @param {Entity} old_entity Previous version of the Entity
  @param {Entity} new_entity New version of the Entity
  @param {Boolean} exec true to make the transaction final, false to store it provisionally
  @param {String} note Comment to be added to the log
  @param {*} next Function that takes(err, entityId, revision_id, revision_num)
*/
exports.update_entity = function(db, old_entity, new_entity, exec, note, next) {
  async.waterfall([
    db.connectWrap,
    db.openTransaction,
    function generate_logentry(client, done, callback) {
      var now = new Date();
      var path = old_entity._path.toDottedPath();
      var entityId = old_entity._entityId;
      var logentry = {
        path: path,
        entityId: entityId, 
        note: note, 
        baseRevisionId: old_entity._revisionId,
        replaceRevisionId: null,
        revisionId: uuid.v1(), 
        revisionNum: old_entity._revisionNum + 1,
        evtStart: now,
        evtEnd: null,
        evtTouched: now,
        evtClass: 'update',
        evtFinal: false,
        data: {
          fromData: old_entity.toLog(entityId),
          toData: new_entity.toLog(entityId)
        }
      };
      callback(null, client, done, logentry);
    },
    clear_tags.bind(this,exec),
    exec_logentry.bind(this,exec),
    write_tags.bind(this,exec),
    write_logentry,
    commit.bind(this,db)
  ], do_cleanup.bind(this,db,next));
};

/**
  This takes a stored entity revision and commits it
  @param {Object} db DB wrapper
  @param {string} revision_id Revision id to be created
  @param {*} next Function that takes(err, entityId, revision_id, revision_num)
*/
exports.commit_entity_rev = function(db, revisionId, next) {
  async.waterfall([
    db.connectWrap,
    db.openTransaction,
    read_logentry.bind(this,revisionId),
    clear_tags.bind(this,true),
    exec_logentry.bind(this,true),
    write_tags.bind(this,true),
    update_logentry,
    commit.bind(this,db)
  ], do_cleanup.bind(this,db,next));
};

/**
  This moves an entity
  @param {Object} db DB wrapper
  @param {Entity} entity Entity to be created
  @param {sitepath} new_path new path
  @param {Boolean} exec true to make the transaction final, false to store it provisionally
  @param {String} note Comment to be added to the log
  @param {*} next Function that takes(err, entityId, revision_id, revision_num)
*/
exports.move_entity = function(db, entity, new_path, exec, note, next) {
  async.waterfall([
    db.connectWrap,
    db.openTransaction,
    function generate_logentry(client, done, callback) {
      var now = new Date();
      var path = entity._path.toDottedPath();
      var logentry = {
        path: path,
        entityId: entity._entityId, 
        note: note,
        baseRevisionId: entity._revisionId,
        replaceRevisionId: null,
        revisionId: uuid.v1(), 
        revisionNum: entity._revisionNum + 1,
        evtStart: now,
        evtEnd: null,
        evtTouched: now,
        evtClass: 'move',
        evtFinal: false,
        data: {
          fromData: entity.toLog(entity._entityId),
          toPath: new_path.toDottedPath()
        }
      };
      callback(null, client, done, logentry);
    },
    clear_tags.bind(this,exec),
    exec_logentry.bind(this,exec),
    write_tags.bind(this,exec),
    write_logentry,
    commit.bind(this,db)
  ], do_cleanup.bind(this,db,next));
};


/**
  This deletes an entity
  @param {Object} db DB wrapper
  @param {Entity} entity entity to be deleted
  @param {Boolean} exec true to make the transaction final, false to store it provisionally
  @param {String} note Comment to be added to the log
  @param {*} next Function that takes(err, entityId, revision_id, revision_num)
*/
exports.delete_entity = function(db, entity, exec, note, next) {
  async.waterfall([
    db.connectWrap,
    db.openTransaction,
    function generate_logentry(client, done, callback) {
      var now = new Date();
      var path = entity._path.toDottedPath();
      var entityId = uuid.v1();
      var logentry = {
        path: path,
        entityId: entity._entityId, 
        note: note,
        baseRevisionId: entity._revisionId,
        replaceRevisionId: null,
        revisionId: uuid.v1(), 
        revisionNum: entity._revisionNum + 1,
        evtStart: now,
        evtEnd: null,
        evtTouched: now,
        evtClass: 'delete',
        evtFinal: false,
        data: {
          fromData: entity.toLog(entityId)
        }
      };
      callback(null, client, done, logentry);
    },
    clear_tags.bind(this,exec),
    exec_logentry.bind(this,exec),
    write_logentry,
    commit.bind(this,db)
  ], do_cleanup.bind(this,db,next));
};

exports.assign_user_to_role = function(db, userpath, role, note, next) {
  async.waterfall([
    db.connectWrap,
    db.openTransaction,
    function generate_logentry(client, done, callback) {
      var now = new Date();
      var path = userpath.toDottedPath();
      var logentry = {
        path: path,
        entityId: null, 
        note: note,
        baseRevisionId: null,
        replaceRevisionId: null,
        revisionId: uuid.v1(), 
        revisionNum: 1,
        evtStart: now,
        evtEnd: null,
        evtTouched: now,
        evtClass: 'assign',
        evtFinal: true,
        data: {
          role: role
        }
      };
      callback(null, client, done, logentry);
    },
    exec_logentry.bind(this,true),
    write_logentry,
    commit.bind(this,db)
  ], do_cleanup.bind(this,db,next));
};

exports.remove_user_from_role = function (db, userpath, role, note, next) {
  async.waterfall([
    db.connectWrap,
    db.openTransaction,
    function generate_logentry(client, done, callback) {
      var now = new Date();
      var path = userpath.toDottedPath();
      var logentry = {
        path: path,
        entityId: null, 
        note: note,
        baseRevisionId: null,
        replaceRevisionId: null,
        revisionId: uuid.v1(), 
        revisionNum: 1,
        evtStart: now,
        evtEnd: null,
        evtTouched: now,
        evtClass: 'deassign',
        evtFinal: true,
        data: {
          role: role
        }
      };
      callback(null, client, done, logentry);
    },
    exec_logentry.bind(this,true),
    write_logentry,
    commit.bind(this,db)
  ], do_cleanup.bind(this,db,next));
};

exports.add_permission_to_role = function(db, role, permission, path, note, next) {
  async.waterfall([
    db.connectWrap,
    db.openTransaction,
    function generate_logentry(client, done, callback) {
      var now = new Date();
      var logentry = {
        path: null,
        entityId: null, 
        note: note,
        baseRevisionId: null,
        replaceRevisionId: null,
        revisionId: uuid.v1(), 
        revisionNum: 1,
        evtStart: now,
        evtEnd: null,
        evtTouched: now,
        evtClass: 'permit',
        evtFinal: true,
        data: {
          role: role,
          permission: permission,
          path: path
        }
      };
      callback(null, client, done, logentry);
    },
    exec_logentry.bind(this,true),
    write_logentry,
    commit.bind(this,db)
  ], do_cleanup.bind(this,db,next));
};

exports.remove_permission_from_role = function (db, role, permission, path, note, next) {
  async.waterfall([
    db.connectWrap,
    db.openTransaction,
    function generate_logentry(client, done, callback) {
      var now = new Date();
      var logentry = {
        path: null,
        entityId: null, 
        note: note,
        baseRevisionId: null,
        replaceRevisionId: null,
        revisionId: uuid.v1(), 
        revisionNum: 1,
        evtStart: now,
        evtEnd: null,
        evtTouched: now,
        evtClass: 'deny',
        evtFinal: true,
        data: {
          role: role,
          permission: permission,
          path: path
        }
      };
      callback(null, client, done, logentry);
    },
    exec_logentry.bind(this,true),
    write_logentry,
    commit.bind(this,db)
  ], do_cleanup.bind(this,db,next));
};
