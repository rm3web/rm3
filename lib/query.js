var SitePath = require ('./sitepath');
var entity = require ('./entity');
var async = require('async');
var util = require('util'),
    errs = require('errs');
var squel = require("squel"),
    sql = require('./sql');
squel.useFlavour('postgres');
var events = require("events");
    logging = require('./logging');

var boundLogger = logging.getRootLogger('query');

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
  this.message = "revisionId not found";
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

exports._queryGen = function(access, curpath, select, target, filter, sort, facet) {
  var doJoin = true;
  if (access.context === 'ROOT') {
    doJoin = false;
  } else if (access.context === 'USERLOOKUP') {
    // You should never do a search whilst looking up a single user.
    throw errs.create('query.insecure', {
      access: access
    });
  }
  var s;
  if (doJoin) {
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
  if (filter.hasOwnProperty('navbar') || filter.hasOwnProperty('tag')) {
    s.join('wh_tag', null, 'wh_tag."subjPath" = wh_entity.path');
  }

  if (target === 'entity') {
    var fields = sql.entityFields();
    if (doJoin) {
      fields = fields.map(function(cv, index, array) {
        return 'wh_entity.' + cv;
      });
    }
    sql.searchFields(s, fields);
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
  if (filter.hasOwnProperty('navbar')) {
    s.where("\"predPath\" = 'navigation'");
    s.where("\"objStr\" = 'navbar'");
  }
  if (filter.hasOwnProperty('tag')) {
    s.where("\"predPath\" = 'plain'");
    s.where("\"objStr\" = ?", filter.tag);
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
      s.where("subject = ?", access.user.toDottedPath());
    } else {
      s.where("role = 'nobody'");
    }
    s.where("permission = 'view'");
  }
  return s.toParam();
};

exports._readLogentry = function(revisionId, client, done, callback) {

  var s = squel.select().from('wh_log');
  sql.searchFields(s, sql.logFields()).where('"revisionId" = ?', revisionId);
  var q = s.toParam();
  q.name = 'select_log_query';
  client.query(q, function(err, result) {
    if (err) {
      return callback(err, client, done, {});
    }
    if (result.rowCount === 0) {
      return callback(errs.create('update.log_not_found', {
        revisionId: revisionId
      }), client, done, {});
    }
    var row = result.rows[0];
    var logentry = {
      path: row.path,
      entityId: row.entityId,
      note: row.note,
      baseRevisionId: row.baseRevisionId,
      replaceRevisionId: row.replaceRevisionId,
      revisionId: row.revisionId,
      revisionNum: row.revisionNum,
      evtStart: row.evtStart,
      evtEnd: row.evtEnd,
      evtTouched: row.evtTouched,
      evtClass: row.evtClass,
      evtFinal: row.evtFinal,
      data: row.data
    };
    callback(err, client, done, logentry);
  });
};

exports.fetchEffectivePermissions = function(db, user, path, next) {
  var q;
  async.waterfall([
    db.connectWrap,
    function(client, done, callback) {
      var s, qname;
      if (user) {
        s = squel.select()
            .field('permission')
            .field('wh_subject_to_roles.role')
            .from('wh_permission_to_role')
            .join('wh_subject_to_roles', null,
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
    if (err) {
      var wrappedError = errs.merge(err, 'query.error', {
        selectEntityQuery: q
      });
      return next(wrappedError);
    }
    if (result.rowCount === 0) {
      return next(errs.create('query.not_found', {
        path: path.toDottedPath(),
        revisionId: null
      }));
    }
    var effective = {};
    result.rows.forEach(function(element, index, array) {
      effective[element.permission] = element.role;
    });
    next(err, effective);
  });
};

function fetchViaEntityTable(db, Entity, access, path, permissions, next) {
  var q;
  async.waterfall([
    db.connectWrap,
    function(client, done, callback) {
      var s = squel.select().from('wh_entity');
      sql.searchFields(s, sql.entityFields()).where('path = ?', path.toDottedPath());
      q = s.toParam();
      q.name = 'select_entity_query';
      client.query(q, function(err, result) {
        callback(err, done, result);
      });
    }
  ], function(err, done, result) {
    done(err);
    if (err) {
      var wrappedError = errs.merge(err, 'query.error', {
        selectEntityQuery: q
      });
      return next(wrappedError);
    }
    if (result.rowCount === 0) {
      return next(errs.create('query.not_found', {
        path: path.toDottedPath(),
        revisionId: null
      }));
    }
    var e = new Entity();
    e.fromDb(result, permissions);
    next(err, e);
  });
}

function fetchViaLog(db, Entity, access, path, revisionId, permissions, next) {
  async.waterfall([
    db.connectWrap,
    exports._readLogentry.bind(this, revisionId)
  ], function(err, client, done, result) {
    done(err);
    if (err) {
      var wrappedError = errs.merge(err, 'query.error', {
      });
      return next(wrappedError);
    }
    var e = new Entity();
    e.fromLog(result, permissions);
    next(err, e);
  });
}

/**
  Fetch an entity at a given path (optionally revisionId)
  @param {Object} db DB wrapper
  @param {*} Entity Entity class
  @param {sitepath} path Path of the entity you'd like to fetch
  @param {null|String} revisionId UUID of the revision, null for most recent
  @param {*} next Function that takes(err, entity)
*/
exports.entityFromPath = function(db, Entity, access, path, revisionId, next) {
  async.waterfall([
    function fetchPerm(callback) {
      if (access.context === 'STANDARD') {
        var user;
        if (access.hasOwnProperty('user')) {
          user = access.user;
        }
        return exports.fetchEffectivePermissions(db, user, path, callback);
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
    function fetchData(permissions, callback) {
      if (revisionId) {
        return fetchViaLog(db, Entity, access, path, revisionId, permissions, callback);
      } else {
        return fetchViaEntityTable(db, Entity, access, path, permissions, callback);
      }
    }
    ], next);
};

/**
  Fetch an entity with a given entityId
  @param {Object} db DB wrapper
  @param {*} Entity Entity class
  @param {String} entityId UUID of the entity ID
  @param {null|String} revisionId UUID of the revision, null for most recent
  @param {*} next Function that takes(err, entity)
*/
exports.entityFromEntityId = function(db, Entity, access, entityId, revisionId, next) {

};

function recordQuery(db, genQuery, rowFunc) {
  var ee = new events.EventEmitter();
  async.waterfall([
    db.connectWrap,
    function(client, done, callback) {
      var q = genQuery;
      var qr = client.query(q);
      qr.on('error', function(err) {
        callback(err, done);
      });
      qr.on('row', rowFunc.bind(this, ee));
      qr.on('end', function() {
        callback(null, done);
      });
    }
  ], function(err, done) {
    done(err);
    if (err) {
      var wrappedError = errs.merge(err, 'query.error', {
      });
      ee.emit('error', wrappedError);
    }
    ee.emit('end');
  });

  return ee;
}

exports.queryHistory = function(db, access, path) {
  var s = squel.select().from('wh_log');
  sql.searchFields(s, sql.logFields()).where('path = ?', path.toDottedPath()).order('"revisionNum"');
  var q = s.toParam();
  q.name = 'select_log_path_query';
  return recordQuery(db, q, function(ee, row) {
    var r = {
      entityId: row.entityId,
      note: row.note,
      baseRevisionId: row.baseRevisionId,
      replaceRevisionId: row.replaceRevisionId,
      revisionId: row.revisionId,
      revisionNum: row.revisionNum,
      evtStart: row.evtStart,
      evtEnd: row.evtEnd,
      evtTouched: row.evtTouched,
      evtClass: row.evtClass,
      evtFinal: row.evtFinal,
      data: row.data
    };
    r.path = new SitePath();
    r.path.fromDottedPath(row.path);
    ee.emit('article', r);
  });
};

exports.query = function(db, access, curpath, select, target, filter, sort, facet) {
  var q = exports._queryGen(access, curpath.toDottedPath(), select, target, filter, sort, facet);
  return recordQuery(db, q, function(ee, row) {
    if (target === 'entity') {
      var r = {};
      r.title = row.summary.title;
      r.summary = row.summary.abstract;
      r.guid = row.entityId;
      r.path = new SitePath();
      r.path.fromDottedPath(row.path);
      ee.emit('article', r);
    } else if (target === 'count') {
      ee.emit('count', row);
    } else {
      var wrappedError = errs.create('query.invalid', {
        details: 'target not a valid type'
      });
      ee.emit('error', wrappedError);
    }
  });
};

exports.permissionsForUser = function(db, user) {
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
  q.name = 'permissionsForUser';
  return recordQuery(db, q, function(ee, row) {
    var r = {
      role: row.role,
      permission: row.permission
    };
    r.path = new SitePath();
    r.path.fromDottedPath(row.path);
    ee.emit('article', r);
  });
};

exports.listRoles = function(db) {
  var s = squel.select().from('wh_permission_to_role')
   .field('role')
   .group('role');
  var q = s.toParam();
  q.name = 'list_roles';
  return recordQuery(db, q, function(ee, row) {
    var r = {
      role: row.role
    };
    r.path = new SitePath();
    r.path.fromDottedPath(row.path);
    ee.emit('article', r);
  });
};

exports.listUsersInRole = function(db, role) {
  var s = squel.select().from('wh_subject_to_roles')
   .field('subject')
   .where('role = ?', role);
  var q = s.toParam();
  q.name = 'list_users_in_role';
  return recordQuery(db, q, function(ee, row) {
    var r = {};
    r.user = new SitePath();
    r.user.fromDottedPath(row.subject);
    ee.emit('article', r);
  });
};

exports.listPermissionsInRole = function(db, role) {
  var s = squel.select().from('wh_permission_to_role')
   .field('permission')
   .field('path')
   .where('role = ?', role);
  var q = s.toParam();
  q.name = 'list_permissions_in_role';
  return recordQuery(db, q, function(ee, row) {
    var r = {
      permission: row.permission
    };
    r.path = row.path;
    ee.emit('article', r);
  });
};
