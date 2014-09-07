var sitepath = require ('./sitepath');
var db = require('./db');
var uuid = require('node-uuid');

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
@param {Entity} entity Entity to be created
@param {*} next Function that takes(err, entity_id, revision_id, revision_num)
*/
exports.create_entity = function(entity, next) {
  db.connect_wrap(function(err, client, done) {
    var view = entity.view();
    var revision_id = uuid.v1();
    var entity_id = uuid.v1();
    var revision_num = 1;
    var insert = client.query({
      text: insert_query,
      values: [entity._path.toDottedPath(), false, entity_id, revision_id, revision_num,
               entity._proto, new Date(), new Date(), entity.summary, entity.data],
      name: 'insert_query'
    }, function(err, result) {
      if(err) {
        console.error('error running query', err);
      }
      done();
      next(err, entity_id, revision_id, revision_num);
    });
  });
};

/**
  This updates an existing entity
@param {Entity} entity Entity to be created
@param {*} next Function that takes(err, entity_id, revision_id, revision_num)
*/
exports.update_entity = function(entity, next) {

};

/**
  This stores a revision of an entity but doesn't commit it
@param {Entity} entity Entity to be created
@param {*} next Function that takes(err, entity_id, revision_id, revision_num)
*/
exports.store_entity_rev = function(entity, next) {

};

/**
  This takes a stored entity revision and commits it
@param {Entity} entity Entity to be created
@param {string} revision_id Revision id to be created
@param {*} next Function that takes(err, entity_id, revision_id, revision_num)
*/
exports.commit_entity_rev = function(entity, revision_id, next) {

};

/**
  This moves an entity
@param {sitepath} old_path old path
@param {sitepath} new_path new path
@param {*} next Function that takes(err, entity_id, revision_id, revision_num)
*/

exports.move_entity = function(old_path, new_path, next) {

};


/**
  This deletes an entity
@param {sitepath} path entity to be deleted
@param {*} next Function that takes(err, entity_id, revision_id, revision_num)
*/
exports.delete_entity = function(path, next) {

};