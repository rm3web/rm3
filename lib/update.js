var sitepath = require ('./sitepath');
var uuid = require('node-uuid');
var async = require('async');
var util = require('util'),
    errs = require('errs');

/**
* @overview These are the update operations that take raw operations (create entity, delete
* entity, update entity, store revision, etc) and persist them to the DB.
* @title Update operations
* @module update
*/

insert_entity_query = "INSERT INTO wh_entity (path, stub, entity_id, revision_id, \
revision_num, proto, modified, created, summary, data) VALUES ($1, $2, \
$3, $4, $5, $6, $7, $8, $9, $10);";
delete_entity_query = "DELETE FROM wh_entity WHERE path = $1;";
update_entity_query = "UPDATE wh_entity SET (stub, entity_id, revision_id, \
revision_num, proto, modified, created, summary, data) = ($2, \
$3, $4, $5, $6, $7, $8, $9, $10) WHERE path = $1;";

insert_log_query = "INSERT INTO wh_log (path, entity_id, note, base_revision_id, \
replace_revision_id, revision_id, revision_num, evt_start, evt_end, \
evt_touched, evt_class, evt_final, data) VALUES ($1, $2, $3, $4, $5, $6, \
$7, $8, $9, $10, $11, $12, $13);";
select_log_query = "SELECT path, entity_id, note, base_revision_id, \
replace_revision_id, revision_id, revision_num, evt_start, evt_end, \
evt_touched, evt_class, evt_final, data FROM wh_log WHERE revision_id = $1;";
update_log_query = "UPDATE wh_log SET (path, entity_id, note, base_revision_id, \
replace_revision_id, revision_num, evt_start, evt_end, \
evt_touched, evt_class, evt_final, data) = ($1, $2, $3, $4, $5, \
$7, $8, $9, $10, $11, $12, $13) WHERE revision_id = $6;";

function InvalidLogClass() {
  this.message = "evt_class in log entry doesn't match anything we expect";
}
util.inherits(InvalidLogClass, Error);
errs.register('update.bad_evt_class', InvalidLogClass);

function post_commit_err(db, client, err, done, next) {
  wrapped_error = db.wrap_error(err);
  db.rollback_transaction(client, function(err) {
    if (err) {
      console.error('REALLY BAD ERROR ROLLING BACK', err);
    }
    done(wrapped_error);
    return next(wrapped_error);
  });
}

function write_logentry(client, done, logentry, callback) {
  var arr = [logentry.path, logentry.entity_id, logentry.note,
             logentry.base_revision_id, logentry.replace_revision_id,
             logentry.revision_id, logentry.revision_num, logentry.evt_start,
             logentry.evt_end, logentry.evt_touched, logentry.evt_class,
             logentry.evt_final, logentry.data];
  client.query({
    text: insert_log_query,
    values: arr,
    name: 'insert_log_query'
  }, function(err, result){
    callback(err, client, done, logentry);
  });
}

function update_logentry(client, done, logentry, callback) {
  var arr = [logentry.path, logentry.entity_id, logentry.note,
             logentry.base_revision_id, logentry.replace_revision_id,
             logentry.revision_id, logentry.revision_num, logentry.evt_start,
             logentry.evt_end, logentry.evt_touched, logentry.evt_class,
             logentry.evt_final, logentry.data];
  client.query({
    text: update_log_query,
    values: arr,
    name: 'update_log_query'
  }, function(err, result){
    callback(err, client, done, logentry);
  });
}

function read_logentry(revision_id, client, done, callback) {
  client.query({
    text: select_log_query,
    values: [revision_id],
    name: 'select_log_query'
  }, function(err, result) {
    if (err) {
      return callback(err, client, done, {});
    }
    if (result.rowCount === 0) {
      return callback(errs.create('update.log_not_found', {
        revision_id: revision_id
      }), client, done, {});
    }
    var row = result.rows[0];
    var logentry = {
      path: row.path,
      entity_id: row.entity_id,
      note: row.note,
      base_revision_id: row.base_revision_id,
      replace_revision_id: row.replace_revision_id,
      revision_id: row.revision_id,
      revision_num: row.revision_num,
      evt_start: row.evt_start,
      evt_end: row.evt_end,
      evt_touched: row.evt_touched,
      evt_class: row.evt_class,
      evt_final: row.evt_final,
      data: row.data
    };
    callback(err, client, done, logentry);
  });
}

function exec_logentry(exec, client, done, logentry, callback) {
  if (!exec) {
    return callback(null, client, done, logentry);
  }
  var now = new Date();
  if (logentry.evt_class === 'create') {
    client.query({
      text: insert_entity_query,
      values: [logentry.path, false, logentry.entity_id, logentry.revision_id, 
             logentry.revision_num, logentry.data.to_data.proto, 
             logentry.data.to_data.modified, logentry.data.to_data.created, 
             logentry.data.to_data.summary, logentry.data.to_data.data],
      name: 'insert_entity_query'
    }, function(err, result){
      if (!err) {
        logentry.evt_final = true;
        logentry.evt_end = now;
      }
      callback(err, client, done, logentry);
    });
  } else if (logentry.evt_class === 'update') {
    client.query({
      text: update_entity_query,
      values: [logentry.path, false, logentry.entity_id, logentry.revision_id,
               logentry.revision_num, logentry.data.to_data.proto,
               logentry.data.to_data.modified, logentry.data.to_data.created,
               logentry.data.to_data.summary, logentry.data.to_data.data],
      name: 'update_entity_query'
    }, function(err, result){
      if (!err) {
        logentry.evt_final = true;
        logentry.evt_end = now;
      }
      callback(err, client, done, logentry);
    });
  } else if (logentry.evt_class === 'delete') {
    client.query({
      text: delete_entity_query,
      values: [logentry.path],
      name: 'delete_entity_query'
    }, function(err, result){
      if (!err) {
        logentry.evt_final = true;
        logentry.evt_end = now;
      }
      callback(err, client, done, logentry);
    });
  } else {
    err = errs.create('update.bad_evt_class', {evt_class: logentry.evt_class });
    callback(err, client, done, logentry);
  }
}

function commit(db, client, done, logentry, callback) {
  db.commit_transaction(client, function(err) {
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
          to_data: entity.to_log(entity_id, now, now)
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
      var entity_id = uuid.v1();
      var logentry = {
        path: path,
        entity_id: old_entity._entity_id, 
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
          from_data: old_entity.to_log(entity_id, now, now),
          to_data: new_entity.to_log(entity_id, now, now)
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
  @param {sitepath} old_path old path
  @param {sitepath} new_path new path
  @param {*} next Function that takes(err, entity_id, revision_id, revision_num)
*/
exports.move_entity = function(db, old_path, new_path, next) {

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
          from_data: entity.to_log(entity_id, now, now)
        }
      };
      callback(null, client, done, logentry);
    },
    exec_logentry.bind(this,exec),
    write_logentry,
    commit.bind(this,db)
  ], do_cleanup.bind(this,db,next));
};