var sitepath = require ('./sitepath');
var entity = require ('./entity');
var async = require('async');

/**
* @overview These are the query operations that return entity structures from the 
* DB.
* @title Query operations
* @module query
*/

select_query = "SELECT path, stub, entity_id, revision_id, revision_num, \
proto, modified, created, summary, data FROM wh_entity WHERE path = $1;";

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
    done();
    if(err) {
      console.error('error running query', err);
      return next(err);
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