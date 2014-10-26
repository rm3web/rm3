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
errs.register('update.bad_evt_class', InvalidLogClass);

function post_commit_err(db, client, err, done, next) {
  var wrapped_error = db.wrap_error(err);
  db.rollback_transaction(client, function(err) {
    if (err) {
      console.error('REALLY BAD ERROR ROLLING BACK', err);
    }
    done(wrapped_error);
    return next(wrapped_error);
  });
}

function write_logentry(client, done, logentry, callback) {
  var s = squel.insert().into('wh_log');
  sql.set_fields(s, {
    "path": logentry.path,
    "entity_id": logentry.entity_id,
    "note": logentry.note,
    "base_revision_id": logentry.base_revision_id,
    "replace_revision_id": logentry.replace_revision_id,
    "revision_id": logentry.revision_id,
    "revision_num": logentry.revision_num,
    "evt_start": logentry.evt_start,
    "evt_end": logentry.evt_end,
    "evt_touched": logentry.evt_touched,
    "evt_class": logentry.evt_class,
    "evt_final": logentry.evt_final,
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
    "entity_id": logentry.entity_id,
    "note": logentry.note,
    "base_revision_id": logentry.base_revision_id,
    "replace_revision_id": logentry.replace_revision_id,
    "revision_num": logentry.revision_num,
    "evt_start": logentry.evt_start,
    "evt_end": logentry.evt_end,
    "evt_touched": logentry.evt_touched,
    "evt_class": logentry.evt_class,
    "evt_final": logentry.evt_final,
    "data": JSON.stringify(logentry.data)
  });
  s.where("revision_id = ?", logentry.revision_id);
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
  if (logentry.evt_class === 'create') {
    s = squel.insert().into('wh_entity');
    sql.set_fields(s, {
      "path": logentry.path,
      "stub": false,
      "entity_id": logentry.entity_id,
      "revision_id": logentry.revision_id,
      "revision_num": logentry.revision_num,
      "proto": logentry.data.to_data.proto,
      "modified": logentry.data.to_data.modified,
      "created": logentry.data.to_data.created,
      "summary": JSON.stringify(logentry.data.to_data.summary),
      "data": JSON.stringify(logentry.data.to_data.data)
    });
    q = s.toParam();
    q.name = 'insert_entity_query';

    client.query(q, function(err, result){
      if (!err) {
        logentry.evt_final = true;
        logentry.evt_end = now;
      }
      callback(err, client, done, logentry);
    });
  } else if (logentry.evt_class === 'update') {
    s = squel.update().table('wh_entity');
    sql.set_fields(s, {
      "stub": false,
      "entity_id": logentry.entity_id,
      "revision_id": logentry.revision_id,
      "revision_num": logentry.revision_num,
      "proto": logentry.data.to_data.proto,
      "modified": logentry.data.to_data.modified,
      "created": logentry.data.to_data.created,
      "summary": JSON.stringify(logentry.data.to_data.summary),
      "data": JSON.stringify(logentry.data.to_data.data)
    });
    s.where("path = ?", logentry.path);
    q = s.toParam();
    q.name = 'update_entity_query';

    client.query(q, function(err, result){
      if (!err) {
        logentry.evt_final = true;
        logentry.evt_end = now;
      }
      callback(err, client, done, logentry);
    });
  } else if (logentry.evt_class === 'delete') {
    s = squel.remove().from('wh_entity');
    s.where("path = ?", logentry.path);
    q = s.toParam();
    q.name = 'delete_entity_query';
    client.query(q, function(err, result){
      if (!err) {
        logentry.evt_final = true;
        logentry.evt_end = now;
      }
      callback(err, client, done, logentry);
    });
  } else if (logentry.evt_class === 'move') {
    s = squel.update().table('wh_entity');
    sql.set_fields(s, {
      "path": logentry.data.to_path,
      "revision_id": logentry.revision_id,
      "revision_num": logentry.revision_num,
    });
    s.where("path = ?", logentry.path);
    q = s.toParam();
    q.name = 'move_entity_query';
    var mv = client.query(q, function(err, result){
      if (!err) {
        logentry.evt_final = true;
        logentry.evt_end = now;
      }
      callback(err, client, done, logentry);
    });
  } else {
    var err = errs.create('update.bad_evt_class', {evt_class: logentry.evt_class });
    callback(err, client, done, logentry);
  }
}

exports._private = {};
exports._private.exec_logentry = exec_logentry;

function commit(db, client, done, logentry, callback) {
  db.commit_transaction(client, function commit_func(err) {
    callback(err, client, done, logentry);
  });
}

function do_cleanup(db, next, err, client, done, logentry) {
  if (err) {
    return post_commit_err(db, client, err, done, next);
  }
  done(err);
  return next(err, logentry.entity_id, logentry.revision_id, logentry.revision_num);
}

/**
  This creates a new entity
  @param {Object} db DB wrapper
  @param {Entity} entity Entity to be created
  @param {Boolean} exec true to make the transaction final, false to store it provisionally
  @param {String} note Comment to be added to the log
  @param {*} next Function that takes(err, entity_id, revision_id, revision_num)
*/
exports.create_entity = function(db, entity, exec, note, next) {
  async.waterfall([
    db.connect_wrap,
    db.open_transaction,
    function generate_logentry(client, done, callback) {
      var now = new Date();
      var path = entity._path.toDottedPath();
      var entity_id = uuid.v1();
      var logentry = {
        path: path,
        entity_id: entity_id, 
        note: note,
        base_revision_id: null,
        replace_revision_id: null,
        revision_id: uuid.v1(), 
        revision_num: 1,
        evt_start: now,
        evt_end: null,
        evt_touched: now,
        evt_class: 'create',
        evt_final: false,
        data: {
          to_data: entity.to_log(entity_id)
        }
      };
      callback(null, client, done, logentry);
    },
    exec_logentry.bind(this,exec),
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
  @param {*} next Function that takes(err, entity_id, revision_id, revision_num)
*/
exports.update_entity = function(db, old_entity, new_entity, exec, note, next) {
  async.waterfall([
    db.connect_wrap,
    db.open_transaction,
    function generate_logentry(client, done, callback) {
      var now = new Date();
      var path = old_entity._path.toDottedPath();
      var entity_id = old_entity._entity_id;
      var logentry = {
        path: path,
        entity_id: entity_id, 
        note: note, 
        base_revision_id: old_entity._revision_id,
        replace_revision_id: null,
        revision_id: uuid.v1(), 
        revision_num: old_entity._revision_num + 1,
        evt_start: now,
        evt_end: null,
        evt_touched: now,
        evt_class: 'update',
        evt_final: false,
        data: {
          from_data: old_entity.to_log(entity_id),
          to_data: new_entity.to_log(entity_id)
        }
      };
      callback(null, client, done, logentry);
    },
    exec_logentry.bind(this,exec),
    write_logentry,
    commit.bind(this,db)
  ], do_cleanup.bind(this,db,next));
};

/**
  This takes a stored entity revision and commits it
  @param {Object} db DB wrapper
  @param {string} revision_id Revision id to be created
  @param {*} next Function that takes(err, entity_id, revision_id, revision_num)
*/
exports.commit_entity_rev = function(db, revision_id, next) {
  async.waterfall([
    db.connect_wrap,
    db.open_transaction,
    read_logentry.bind(this,revision_id),
    exec_logentry.bind(this,true),
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
  @param {*} next Function that takes(err, entity_id, revision_id, revision_num)
*/
exports.move_entity = function(db, entity, new_path, exec, note, next) {
  async.waterfall([
    db.connect_wrap,
    db.open_transaction,
    function generate_logentry(client, done, callback) {
      var now = new Date();
      var path = entity._path.toDottedPath();
      var logentry = {
        path: path,
        entity_id: entity._entity_id, 
        note: note,
        base_revision_id: entity._revision_id,
        replace_revision_id: null,
        revision_id: uuid.v1(), 
        revision_num: entity._revision_num + 1,
        evt_start: now,
        evt_end: null,
        evt_touched: now,
        evt_class: 'move',
        evt_final: false,
        data: {
          from_data: entity.to_log(entity._entity_id),
          to_path: new_path.toDottedPath()
        }
      };
      callback(null, client, done, logentry);
    },
    exec_logentry.bind(this,exec),
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
  @param {*} next Function that takes(err, entity_id, revision_id, revision_num)
*/
exports.delete_entity = function(db, entity, exec, note, next) {
  async.waterfall([
    db.connect_wrap,
    db.open_transaction,
    function generate_logentry(client, done, callback) {
      var now = new Date();
      var path = entity._path.toDottedPath();
      var entity_id = uuid.v1();
      var logentry = {
        path: path,
        entity_id: entity._entity_id, 
        note: note,
        base_revision_id: entity._revision_id,
        replace_revision_id: null,
        revision_id: uuid.v1(), 
        revision_num: entity._revision_num + 1,
        evt_start: now,
        evt_end: null,
        evt_touched: now,
        evt_class: 'delete',
        evt_final: false,
        data: {
          from_data: entity.to_log(entity_id)
        }
      };
      callback(null, client, done, logentry);
    },
    exec_logentry.bind(this,exec),
    write_logentry,
    commit.bind(this,db)
  ], do_cleanup.bind(this,db,next));
};