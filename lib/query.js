var sitepath = require ('./sitepath');
var entity = require ('./entity');
var async = require('async');
var util = require('util'),
    errs = require('errs');
var squel = require("squel");
squel.useFlavour('postgres');

/**
* @overview These are the query operations that return entity structures from the 
* DB.
* @title Query operations
* @module query
*/

select_entity_query = "SELECT path, stub, entity_id, revision_id, revision_num, \
proto, modified, created, summary, data FROM wh_entity WHERE path = $1;";
select_log_query = "SELECT path, entity_id, note, base_revision_id, \
replace_revision_id, revision_id, revision_num, evt_start, evt_end, \
evt_touched, evt_class, evt_final, data FROM wh_log WHERE revision_id = $1;";

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

function RevisionIdNotFoundError() {
  this.message = "revision_id not found";
}
util.inherits(RevisionIdNotFoundError, Error);
errs.register('update.log_not_found', RevisionIdNotFoundError);

function InvalidQuery() {
  this.message = "invalid query";
}
util.inherits(InvalidQuery, Error);
errs.register('query.invalid', InvalidQuery);

exports._query_gen = function(curpath, select, target, filter, sort, facet) {
  var s = squel.select()
    .from('wh_entity');
  if (target === 'entity') {
    s.field('path')
     .field('stub')
     .field('entity_id')
     .field('revision_id')
     .field('revision_num')
     .field('proto')
     .field('modified')
     .field('created')
     .field('summary')
     .field('data');
  } else if (target === 'count') {
    s.field('count(*)');
  } else {
    throw errs.create('query.invalid', {
        details: 'target not a valid type'
      });    
  }
  if (select === 'child') {
    s.where('path <@ ?', curpath);
  } else if (select === 'parents') {
    s.where('path @> ?', curpath);
  } else if (select === 'dir') {
    s.where("path ~ '?.*{1}'", curpath);
  } else {
    throw errs.create('query.invalid', {
        details: 'select not a valid type'
      });
  }
  if (filter.hasOwnProperty('protos')) {
    filter.protos.forEach(function(element, index, array) {
      s.where('proto = ?', element);
    });
  }
  if (filter.hasOwnProperty('notprotos')) {
    filter.notprotos.forEach(function(element, index, array) {
      s.where('proto <> ?', element);
    });
  }
  if (filter.hasOwnProperty('before')) {
    s.where("created < ?", filter.before);
  }
  if (filter.hasOwnProperty('after')) {
    s.where("created >= ?", filter.after);
  }
  if (sort === 'changed') {
    s.order('modified');
  } else if (sort === 'created') {
    s.order('created');
  } else {
    s.order('path');
  }
  return s.toParam();
};

exports._read_logentry = function(revision_id, client, done, callback) {
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
};

function fetch_via_entity_table(db, Entity, path, next) {
  async.waterfall([
    db.connect_wrap,
    function(client, done, callback){
      client.query({
        text: select_entity_query,
        values: [path.toDottedPath()],
        name: 'select_entity_query'
      }, function(err, result){
        callback(err, done, result);
      });
    }
  ], function(err, done, result) {
    done(err);
    if(err) {
      var wrapped_error = errs.merge(err, 'query.error', {
        select_entity_query: select_entity_query
      });
      return next(wrapped_error);
    }
    if (result.rowCount === 0) {
      return next(errs.create('query.not_found', {
        path: path.toDottedPath(),
        revision_id: null
      }));
    }
    e = new Entity();
    e.from_db(result);
    next(err, e); 
  });
}

function fetch_via_log(db, Entity, path, revision_id, next) {
  async.waterfall([
    db.connect_wrap,
    exports._read_logentry.bind(this,revision_id)
  ], function(err, client, done, result) {
    done(err);
    if(err) {
      var wrapped_error = errs.merge(err, 'query.error', {
        select_query: select_query
      });
      return next(wrapped_error);
    }
    e = new Entity();
    e.from_log(result);
    next(err, e); 
  });
}


/**
  Fetch an entity at a given path (optionally revision_id)
  @param {Object} db DB wrapper
  @param {*} Entity Entity class
  @param {sitepath} path Path of the entity you'd like to fetch
  @param {null|String} revision_id UUID of the revision, null for most recent
  @param {*} next Function that takes(err, entity)
*/
exports.entity_from_path = function(db, Entity, path, revision_id, next) {
  if (revision_id) {
    return fetch_via_log(db, Entity, path, revision_id, next);
  } else {
    return fetch_via_entity_table(db, Entity, path, next);
  }
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