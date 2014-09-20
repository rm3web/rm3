var sitepath = require ('./sitepath');
var uuid = require('node-uuid');
var async = require('async');

/**
* @overview These are the update operations that take raw operations (create entity, delete
* entity, update entity, store revision, etc) and persist them to the DB.
* @title Update operations
* @module update
*/

insert_entity_query = "INSERT INTO wh_entity (path, stub, entity_id, revision_id, \
revision_num, proto, modified, created, summary, data) VALUES ($1, $2, \
$3, $4, $5, $6, $7, $8, $9, $10);";
insert_log_query = "INSERT INTO wh_log (path, entity_id, note, base_revision_id, \
replace_revision_id, revision_id, revision_num, evt_start, evt_end, \
evt_touched, evt_class, evt_final, data) VALUES ($1, $2, $3, $4, $5, $6, \
$7, $8, $9, $10, $11, $12, $13);";


function post_commit_err(db, client, err, done, next) {
  wrapped_error = db.wrap_error(err);
  console.error('error running query', wrapped_error);
  db.rollback_transaction(client, function(wrapped_error) {
    if (err) {
      console.error('REALLY BAD ERROR ROLLING BACK', wrapped_error);
    }
    done(wrapped_error);
    return next(wrapped_error);
  });
}

function log_create(client, path, entity_id, note, revision_num, revision_id, 
                   evt_start, evt_end, evt_touched, to_data, callback) {
  data = {to_data: to_data};
  insert = client.query({
    text: insert_log_query,
    values: [path, entity_id, note, null, null, revision_num, revision_id,
    evt_start, evt_end, evt_touched, 'create', true, data],
    name: 'insert_log_query'
  }, function(err, result){
    callback(err);
  });  
}

/**
  This creates a new entity
  @param {Object} db DB wrapper
  @param {Entity} entity Entity to be created
  @param {*} next Function that takes(err, entity_id, revision_id, revision_num)
*/
exports.create_entity = function(db, entity, next) {
  var now = new Date();
  var path = entity._path.toDottedPath();
  async.waterfall([
    db.connect_wrap,
    db.open_transaction,
    function insert_query_func(client, done, callback){
      var revision_id = uuid.v1();
      var entity_id = uuid.v1();
      var revision_num = 1;
      insert = client.query({
        text: insert_entity_query,
        values: [path, false, entity_id, revision_id, revision_num,
               entity._proto, now, now, entity.summary, entity.data],
        name: 'insert_entity_query'
      }, function(err, result){
        callback(err, client, done, result, entity_id, revision_id, revision_num);
      });
    },
    function log(client, done, result, entity_id, revision_id, revision_num, callback) {
      var to_data = {
        path: path,
        stub: false,
        entity_id: entity_id,
        proto: entity._proto,
        modified: now,
        created: now,
        summary: entity.summary,
        data: entity.data
      };
      log_create(client, path, entity_id, 'create', revision_id, revision_num, 
                   now, now, now, to_data, function(err) {
        callback(err, client, done, result, entity_id, revision_id, revision_num);
      });
    },
    function commit(client, done, result, entity_id, revision_id, revision_num, callback) {
      db.commit_transaction(client, function(err) {
        callback(err, client, done, result, entity_id, revision_id, revision_num);
      });
    }
  ], function(err, client, done, result, entity_id, revision_id, revision_num) {
    if (err) {
      return post_commit_err(db, client, err, done, next);
    }
    done(err);
    return next(err, entity_id, revision_id, revision_num);
  });
};

/**
  This updates an existing entity
  @param {Object} db DB wrapper
  @param {Entity} entity Entity to be created
  @param {*} next Function that takes(err, entity_id, revision_id, revision_num)
*/
exports.update_entity = function(db, entity, next) {

};

/**
  This stores a revision of an entity but doesn't commit it
  @param {Object} db DB wrapper
  @param {Entity} entity Entity to be created
  @param {*} next Function that takes(err, entity_id, revision_id, revision_num)
*/
exports.store_entity_rev = function(db, entity, next) {

};

/**
  This takes a stored entity revision and commits it
  @param {Object} db DB wrapper
  @param {Entity} entity Entity to be created
  @param {string} revision_id Revision id to be created
  @param {*} next Function that takes(err, entity_id, revision_id, revision_num)
*/
exports.commit_entity_rev = function(db, entity, revision_id, next) {

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
  @param {sitepath} path entity to be deleted
  @param {*} next Function that takes(err, entity_id, revision_id, revision_num)
*/
exports.delete_entity = function(db, path, next) {

};