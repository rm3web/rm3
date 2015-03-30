var SitePath = require ('./sitepath');
var entity = require ('./entity');
var async = require('async');
var util = require('util'),
    errs = require('errs');
var squel = require("squel"),
    sql = require('./sql');
squel.useFlavour('postgres');
var events = require("events");

/**
* @overview These are the query operations that return entity structures from the 
* DB.
* @title Query operations
* @module query
*/

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

function InsecureQuery() {
  this.message = "insecuere query";
}
util.inherits(InsecureQuery, Error);
errs.register('query.insecure', InvalidQuery);

/*
select wh_entity.path from wh_entity INNER JOIN wh_permission_to_role 
INNER JOIN wh_subject_to_roles ON (wh_permission_to_role.role = wh_subject_to_roles.role) 
ON (wh_entity.path ~ wh_permission_to_role.query) 
WHERE subject = 'wh.users.wirehead' AND permission = 'view';
*/

exports._query_gen = function(access, curpath, select, target, filter, sort, facet) {
  var do_join = true;
  if (access.context === 'ROOT') {
    do_join = false;
  } else if (access.context === 'USERLOOKUP') {
    // You should never do a search whilst looking up a single user.
    throw errs.create('query.insecure', {
      access: access
    });
  }
  var s;
  if (do_join) {
    s = squel.select()
        .from('wh_entity')
        .join('wh_permission_to_role', null, 'wh_entity.path ~ wh_permission_to_role.query');
    if (access.hasOwnProperty('user')) {
      s.join('wh_subject_to_roles', null, 'wh_permission_to_role.role = wh_subject_to_roles.role');
    }
  } else {
    s = squel.select()
        .from('wh_entity');
  }
    
  if (target === 'entity') {
    var fields = sql.entity_fields();
    if (do_join) {
      fields = fields.map(function(cv, index, array) {
        return 'wh_entity.' + cv;
      });
    }
    sql.search_fields(s,fields);
  } else if (target === 'count') {
    s.field('count(*)');
  } else {
    throw errs.create('query.invalid', {
        details: 'target not a valid type'
      });    
  }
  if (select === 'child') {
    s.where('wh_entity.path <@ ?', curpath);
  } else if (select === 'parents') {
    s.where('wh_entity.path @> ?', curpath);
  } else if (select === 'dir') {
    s.where("wh_entity.path ~ lquery(? || '.*{1}')", curpath);
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
  if (target !== 'count') {
    if (sort === 'changed') {
      s.order('modified');
    } else if (sort === 'created') {
      s.order('created');
    } else {
      s.order('path');
    }
  }
  if (access.context !== 'ROOT') {
    if (access.hasOwnProperty('user')) {
      s.where("subject = ?", access.user.path().toDottedPath());
    } else {
      s.where("role = 'nobody'");
    }
    s.where("permission = 'view'");
  }
  return s.toParam();
};

exports._read_logentry = function(revision_id, client, done, callback) {
  var s = squel.select().from('wh_log');
  sql.search_fields(s,sql.log_fields()).where('revision_id = ?', revision_id);
  var q = s.toParam();
  q.name = 'select_log_query';
  client.query(q, function(err, result) {
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

exports.fetch_effective_permissions = function(db, user, path, next) {
  var q;
  async.waterfall([
    db.connect_wrap,
    function(client, done, callback){
      var s, qname;
      if (user) {
        s = squel.select()
            .field('permission')
            .field('wh_subject_to_roles.role')
            .from('wh_permission_to_role')
            .join('wh_subject_to_roles',null,
                  'wh_permission_to_role.role = wh_subject_to_roles.role')
            .where('subject = ?', user.toDottedPath())
            .where('ltree(text(?)) ~ wh_permission_to_role.query', path.toDottedPath());
        qname = 'fetch_effective_permissions';
      } else {
        s = squel.select()
            .field('permission')
            .field('role')
            .from('wh_permission_to_role')
            .where('role = ?', 'nobody')
            .where('ltree(text(?)) ~ wh_permission_to_role.query', path.toDottedPath());
        qname = 'fetch_effective_permissions_noobdy';
      }
      var q = s.toParam();
      q.name = qname;
      client.query(q, function(err, result) {
        callback(err, done, result);
      });
    }
  ], function(err, done, result) {
    done(err);
    if(err) {
      var wrapped_error = errs.merge(err, 'query.error', {
        select_entity_query: q
      });
      return next(wrapped_error);
    }
    if (result.rowCount === 0) {
      return next(errs.create('query.not_found', {
        path: path.toDottedPath(),
        revision_id: null
      }));
    }
    var effective = {};
    result.rows.forEach(function(element, index, array) {
      effective[element.permission] = element.role;
    });
    next(err,effective); 
  });
};

function fetch_via_entity_table(db, Entity, access, path, permissions, next) {
  var q;
  async.waterfall([
    db.connect_wrap,
    function(client, done, callback){
      var s = squel.select().from('wh_entity');
      sql.search_fields(s,sql.entity_fields()).where('path = ?', path.toDottedPath());
      q = s.toParam();
      q.name = 'select_entity_query';
      client.query(q, function(err, result){
        callback(err, done, result);
      });
    }
  ], function(err, done, result) {
    done(err);
    if(err) {
      var wrapped_error = errs.merge(err, 'query.error', {
        select_entity_query: q
      });
      return next(wrapped_error);
    }
    if (result.rowCount === 0) {
      return next(errs.create('query.not_found', {
        path: path.toDottedPath(),
        revision_id: null
      }));
    }
    var e = new Entity();
    e.from_db(result, permissions);
    next(err, e); 
  });
}

function fetch_via_log(db, Entity, access, path, revision_id, permissions, next) {
  async.waterfall([
    db.connect_wrap,
    exports._read_logentry.bind(this,revision_id)
  ], function(err, client, done, result) {
    done(err);
    if(err) {
      var wrapped_error = errs.merge(err, 'query.error', {
      });
      return next(wrapped_error);
    }
    var e = new Entity();
    e.from_log(result, permissions);
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
exports.entity_from_path = function(db, Entity, access, path, revision_id, next) {
  async.waterfall([
    function fetch_perm(callback) {
      if (access.context === 'STANDARD') {
        var user;
        if (access.hasOwnProperty('user')) {
          user = access.user;
        }
        return exports.fetch_effective_permissions(db, user, path, callback);
      } else if (access.context === 'ROOT') {
        return callback(null, {});
      } else if (access.context === 'USERLOOKUP') {
        return callback(null, {});
      } else {
        return callback(errs.create('query.insecure', {
          access: access
        }));
      }
    },
    function fetch_data(permissions, callback) {
      if (revision_id) {
        return fetch_via_log(db, Entity, access, path, revision_id, permissions, callback);
      } else {
        return fetch_via_entity_table(db, Entity, access, path, permissions, callback);
      }
    }
    ], next);
};

/**
  Fetch an entity with a given entity_id
  @param {Object} db DB wrapper
  @param {*} Entity Entity class
  @param {String} entity_id UUID of the entity ID
  @param {null|String} revision_id UUID of the revision, null for most recent
  @param {*} next Function that takes(err, entity)
*/
exports.entity_from_entity_id = function(db, Entity, access, ntity_id, revision_id, next) {


};

function record_query(db, gen_query, row_func) {
  var ee = new events.EventEmitter();
  async.waterfall([
    db.connect_wrap,
    function(client, done, callback){
      var q = gen_query;
      var qr = client.query(q);
      qr.on('error', function(err) {
        callback(err, done);
      });
      qr.on('row', row_func.bind(this, ee));
      qr.on('end', function() {
        callback(null, done);
      });
    }
  ], function(err, done) {
    done(err);
    if(err) {
      var wrapped_error = errs.merge(err, 'query.error', {
      });
      ee.emit('error', wrapped_error);
    }
    ee.emit('end');
  });

  return ee;
}

exports.query_history = function(db, access, path) {
  var s = squel.select().from('wh_log');
  sql.search_fields(s,sql.log_fields()).where('path = ?', path.toDottedPath()).order('revision_num');
  var q = s.toParam();
  q.name = 'select_log_path_query';
  return record_query(db, q,function(ee, row) {
    var r = {
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
    r.path = new SitePath();
    r.path.fromDottedPath(row.path);
    ee.emit('article', r);
  });
};

exports.query = function(db, access, curpath, select, target, filter, sort, facet) {
  var q = exports._query_gen(access, curpath.toDottedPath(), select, target, filter, sort, facet);
  return record_query(db, q,function(ee, row) {
    if (target === 'entity') {
      var r = {};
      r.title = row.summary.title;
      r.summary = row.summary.abstract;
      r.guid = row.entity_id;
      r.path = new SitePath();
      r.path.fromDottedPath(row.path);
      ee.emit('article', r);
    } else if (target === 'count') {
      ee.emit('count', row);
    } else {
      var wrapped_error = errs.create('query.invalid', {
        details: 'target not a valid type'
      });
      ee.emit('error', wrapped_error);
    }
  });
};

exports.permissions_for_user = function(db, user) {
  var s = squel.select().from('wh_subject_to_roles')
   .field('wh_permission_to_role.role')
   .field('permission')
   .field('path')
   .join("wh_permission_to_role", null, "wh_permission_to_role.role = wh_subject_to_roles.role")
   .where('wh_subject_to_roles.subject = ?', user.toDottedPath())
   .group('wh_permission_to_role.role')
   .group('wh_permission_to_role.permission')
   .group('path');
  var q = s.toParam();
  q.name = 'permissions_for_user';
  return record_query(db, q, function(ee, row) {
    var r = {
      role: row.role,
      permission: row.permission
    };
    r.path = new SitePath();
    r.path.fromDottedPath(row.path);
    ee.emit('article', r);
  });
};

exports.list_roles = function(db) {
  var s = squel.select().from('wh_permission_to_role')
   .field('role')
   .group('role');
  var q = s.toParam();
  q.name = 'list_roles';
  return record_query(db, q, function(ee, row) {
    var r = {
      role: row.role
    };
    r.path = new SitePath();
    r.path.fromDottedPath(row.path);
    ee.emit('article', r);
  });
};

exports.list_users_in_role = function(db, role) {
  var s = squel.select().from('wh_subject_to_roles')
   .field('subject')
   .where('role = ?', role);
  var q = s.toParam();
  q.name = 'list_users_in_role';
  return record_query(db, q, function(ee, row) {
    var r = {};
    r.user = new SitePath();
    r.user.fromDottedPath(row.subject);
    ee.emit('article', r);
  });
};

exports.list_permissions_in_role = function(db, role) {
  var s = squel.select().from('wh_permission_to_role')
   .field('permission')
   .field('path')
   .where('role = ?', role);
  var q = s.toParam();
  q.name = 'list_permissions_in_role';
  return record_query(db, q, function(ee, row) {
    var r = {
      permission: row.permission
    };
    r.path = new SitePath();
    r.path.fromDottedPath(row.path);
    ee.emit('article', r);
  });
};
