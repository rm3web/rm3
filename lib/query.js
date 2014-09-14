var sitepath = require ('./sitepath');
var entity = require ('./entity');
var async = require('async');
var util = require('util'),
    errs = require('errs');

/**
* @overview These are the query operations that return entity structures from the 
* DB.
* @title Query operations
* @module query
*/

select_query = "SELECT path, stub, entity_id, revision_id, revision_num, \
proto, modified, created, summary, data FROM wh_entity WHERE path = $1;";

function EntityNotFoundError() {
  this.message = "Entity not found";
}
util.inherits(EntityNotFoundError, Error);
errs.register('query.not_found', EntityNotFoundError);

function QueryError() {
  this.message = "Error in query";
}
util.inherits(QueryError, Error);
errs.register('query.error', QueryError);

/**
  Fetch an entity at a given path (optionally revision_id)
  @param {Object} db DB wrapper
  @param {*} Entity Entity class
  @param {sitepath} path Path of the entity you'd like to fetch
  @param {null|String} revision_id UUID of the revision, null for most recent
  @param {*} next Function that takes(err, entity)
*/
exports.entity_from_path = function(db, Entity, path, revision_id, next) {
  async.waterfall([
    db.connect_wrap,
    function(client, done, callback){
      client.query({
        text: select_query,
        values: [path.toDottedPath()],
        name: 'select_query'
      }, function(err, result){
        callback(err, done, result);
      });
    }
  ], function(err, done, result) {
    if(err) {
      var wrapped_error = errs.merge(err, 'query.error', {
        select_query: select_query
      });
      console.error('error running query', wrapped_error);
      return next(wrapped_error);
    }
    done();
    if (result.rowCount === 0) {
      return next(errs.create('query.not_found', {
        path: path.toDottedPath(),
        revision_id: revision_id
      }));
    }
    e = new Entity();
    e.from_db(result);
    next(err, e); 
  });
};

/**
  Fetch an entity with a given entity_id
  @param {Object} db DB wrapper
  @param {*} Entity Entity class
  @param {String} entity_id UUID of the entity ID
  @param {null|String} revision_id UUID of the revision, null for most recent
  @param {*} next Function that takes(err, entity)
*/
exports.entity_from_entity_id = function(db, Entity, entity_id, revision_id, next) {


};