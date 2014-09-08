var sitepath = require ('./sitepath');
var uuid = require('node-uuid');
var async = require('async');

/**
* @overview These are the update operations that take raw operations (create entity, delete
* entity, update entity, store revision, etc) and persist them to the DB.
* @title Update operations
* @module update
*/

insert_query = "INSERT INTO wh_entity (path, stub, entity_id, revision_id, \
revision_num, proto, modified, created, summary, data) VALUES ($1, $2, \
$3, $4, $5, $6, $7, $8, $9, $10);";

/**
  This creates a new entity
  @param {Object} db DB wrapper
  @param {Entity} entity Entity to be created
  @param {*} next Function that takes(err, entity_id, revision_id, revision_num)
*/
exports.create_entity = function(db, entity, next) {
  async.waterfall([
    db.connect_wrap,
    function open_transaction(client, done, callback){
      client.query('BEGIN', function(err, result) {
        callback(err, client, done);
      });
    },
    function insert_query_func(client, done, callback){
      var view = entity.view();
      var revision_id = uuid.v1();
      var entity_id = uuid.v1();
      var revision_num = 1;
      insert = client.query({
        text: insert_query,
        values: [entity._path.toDottedPath(), false, entity_id, revision_id, revision_num,
               entity._proto, new Date(), new Date(), entity.summary, entity.data],
        name: 'insert_query'
      }, function(err, result){
        callback(err, client, done, result, entity_id, revision_id, revision_num);
      });
    }
  ], function(err, client, done, result, entity_id, revision_id, revision_num) {
    if(err) {
      console.error('error running query', err);
      client.query('ROLLBACK', function(err, result) {
        if (err) {
          console.error('REALLY BAD ERROR ROLLING BACK', err);
          // From the pg module docs:
          //if there was a problem rolling back the query
          //something is seriously messed up.  Return the error
          //to the done function to close & remove this client from
          //the pool.  If you leave a client in the pool with an unaborted
          //transaction __very bad things__ will happen.
        }
        done(err);
        return next(err);
      });
    }
    client.query('COMMIT', function(err, result) {
      if (err) {
        console.error('REALLY BAD ERROR COMMITTING', err)
        return next(err);
      }
      done(err);
      return next(err, entity_id, revision_id, revision_num);
    });
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