var SitePath = require ('./sitepath');
var entity = require ('./entity');
var async = require('async');
var util = require('util'),
    errs = require('errs');
var squel = require("squel").useFlavour('postgres'),
    sql = require('./sql');
var events = require("events");
var logging = require('./logging');

squel.registerValueHandler(Date, function(date) {
  // The pg driver lets us send raw dates
  return date;
});

// Workaround for https://github.com/hiddentao/squel/pull/156
squel.cls.DefaultQueryBuilderOptions.autoQuoteAliasNames = false;
var boundLogger = logging.getRootLogger('query');

/**
* @overview These are the query operations that return entity structures from the
* DB.
*
* A few words on query security:
* Query operations, save for information on the permission structure, take an
* `access` paramater.  You need to supply the `context` you are working under,
* which can be `ROOT` for if you are ignoring all access controls,
* or `USERLOOKUP` if you are trying to find a user, which only lets you do a few
* operations without permission, or `STANDARD` for the normal case.
*
* You probably want to use either the `activityfeed` or `indexfeed` libraries
* to actually take the database records into a useful form.
*
* @title Query operations
* @module query
*/

function EntityNotFoundError() {
  this.message = "Entity not found";
}
util.inherits(EntityNotFoundError, Error);
errs.register('query.entity_not_found', EntityNotFoundError);

function PermissionsNotFoundError() {
  this.message = "Entity not found";
}
util.inherits(PermissionsNotFoundError, Error);
errs.register('query.permissions_not_found', PermissionsNotFoundError);

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

/**
 * Generate an activity-feed related query.
 *
 * Select:
 * `child` will select any children nodes of `curpath`
 * `parents` will select all parent nodes of `curpath`
 * `dir` will select any nodes directly underneath `curpath`
 *
 * @param {Object} access The access credentials to use
 * @param {SitePath} curpath The current path
 * @param {string} select `child`, `dir`, or `parents`.
 * @param {SitePath|null} userpath The user's path we are looking at
 * @param {Object} pagination The pagination
 * @return {Object} a squel query
 */
exports._activityQueryGen = function(access, curpath, select, userpath, pagination) {
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
        .from('wh_log')
        .join('wh_permission_to_role', null, 'wh_log.path ~ wh_permission_to_role.query');
    if (access.hasOwnProperty('user')) {
      s.join('wh_subject_to_roles', null, 'wh_permission_to_role.role = wh_subject_to_roles.role');
    }
  } else {
    s = squel.select()
        .from('wh_entity');
  }
  // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
  s.left_join('wh_entity', 'obj', 'obj.path = wh_log.path');
  s.left_join('wh_entity', 'actor', 'actor.path = wh_log."actorPath"');
  // jscs:enable

  var fields = sql.logFields();
  if (doJoin) {
    fields = fields.map(function(cv, index, array) {
      return 'wh_log.' + cv;
    });
  }
  sql.searchFields(s, fields);
  s.field('obj.proto', '"objProto"');
  s.field('obj.summary', '"objSummary"');
  s.field('actor.proto', '"actorProto"');
  s.field('actor.summary', '"actorSummary"');

  if (userpath) {
    s.where('wh_log."actorPath" = ?', userpath.toDottedPath());
  }

  if (select === 'child') {
    s.where('wh_log.path <@ ?', curpath);
  } else if (select === 'parents') {
    s.where('wh_log.path @> ?', curpath);
  } else if (select === 'dir') {
    s.where("wh_log.path ~ lquery(? || '.*{1}')", curpath);
  } else {
    throw errs.create('query.invalid', {
        details: 'select not a valid type'
      });
  }

  // Based on Markus Winand's talk "Pagination Done the PostgreSQL Way"
  // for PGDay on 1st Feb 2013 and
  // http://leopard.in.ua/2014/10/11/postgresql-paginattion/
  //
  // Doing a seek instead of an offset is generally better, except that you can't
  // actually page to a arbitrary block of data.
  if (pagination.startId && pagination.startNum && pagination.startDate) {
    s.where('(wh_log."evtEnd", wh_log."revisionNum", wh_log."revisionId") < (?,?,?)',
      pagination.startDate, pagination.startNum, pagination.startId);
  } else if (pagination.start) {
    // This is slower, but if you ever wanted a UI to let you click a button to
    // page from page #1 to page #142, here you go.
    s.offset(pagination.start);
  }

  if (pagination.limit) {
    s.limit(pagination.limit);
  }

  if (access.context !== 'ROOT') {
    if (access.hasOwnProperty('user')) {
      s.where("subject = ?", access.user.toDottedPath());
    } else {
      s.where("role = 'nobody'");
    }
    s.where("permission = 'view'");
  }

  // Note: Sort order is important to make the comparison work.
  s.order('wh_log."evtEnd"', false);
  s.order('wh_log."revisionNum"', false);
  s.order('wh_log."revisionId"', false);

  return s.toParam();
};

/**
 * Generate an index-feed related query.
 *
 * Select:
 * `child` will select any children nodes of `curpath`
 * `parents` will select all parent nodes of `curpath`
 * `dir` will select any nodes directly underneath `curpath`
 *
 * Filter:
 * `filter.before = new Date()` will filter everything before a date, `filter.after`
 * does the opposite.
 * `filter.protos = 'index'` will filter for anything with the `index` proto,
 * `filter.noprotos` will filter out anything with that proto.
 * `filter.navbar` will select only navbar entries
 * `filter.tag` will search for a given tag
 *
 * @param {Object} access The access credentials to use
 * @param {SitePath} curpath The current path
 * @param {string} select `child`, `dir`, or `parents`.
 * @param {string} target `entity` or `count`.
 * @param {Object} filter filterng paramaters
 * @param {Object} sort `changed` or `created`
 * @param {Object} facet faceting parameters
 * @return {Object} a squel query
 */
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

/**
 * Read a logentry
 *
 * @param {string} revisionId The revision ID to fetch
 * @param {Object} client The db client to use
 * @param {Object} done Postgres's done object
 * @param {Function} callback A callback that takes (err, client, done, logentry)
 */
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
    var logentry = result.rows[0];
    callback(err, client, done, logentry);
  });
};

/**
 * Fetch a node's effective permissions (this works even if a node doesn't exist)
 *
 * @param {Object} db The db client to use
 * @param {Object} ctx The logging context
 * @param {SitePath} user The user to check the permissions for
 * @param {SitePath} path The path to check
 * @param {Function} next A callback that takes (err, permissions)
 */
exports.fetchEffectivePermissions = function(db, ctx, user, path, next) {
  var q;
  boundLogger.info('fetchEffectivePermissions', {
    ctx: ctx,
    user: user,
    path: path
  });
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
      return logging.logAndWrapError(boundLogger, err,
        'fetchEffectivePermissions error', 'query.error', {
          ctx: ctx,
          selectEntityQuery: q
        }, next);
    }
    if (result.rowCount === 0) {
      return logging.logAndCreateError(boundLogger,
        'fetchEffectivePermissions rowCount',
        'query.permissions_not_found', {
          ctx: ctx,
          path: path.toDottedPath(),
          revisionId: null
        }, next);
    }
    var effective = {};
    result.rows.forEach(function(element, index, array) {
      effective[element.permission] = element.role;
    });
    next(err, effective);
  });
};

function fetchViaEntityTable(db, Entity, ctx, access, path, permissions, next) {
  var q;
  boundLogger.info('fetchViaEntityTable', {
    ctx: ctx,
    path: path,
    access: access
  });
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
      return logging.logAndWrapError(boundLogger, err,
        'fetchViaEntityTable error', 'query.error', {
          ctx: ctx,
          selectEntityQuery: q
        }, next);
    }
    if (result.rowCount === 0) {
      return logging.logAndCreateError(boundLogger,
        'fetchViaEntityTable rowCount',
        'query.entity_not_found', {
          ctx: ctx,
          path: path.toDottedPath(),
          revisionId: null
        }, next);
    }
    var e = new Entity();
    e.fromDb(result, permissions);
    next(err, e);
  });
}

function fetchViaLog(db, Entity, ctx, access, path, revisionId, permissions, next) {
  boundLogger.info('fetchViaLog', {
    ctx: ctx,
    path: path,
    revisionId: revisionId,
    access: access
  });
  async.waterfall([
    db.connectWrap,
    exports._readLogentry.bind(this, revisionId)
  ], function(err, client, done, result) {
    done(err);
    if (err) {
      return logging.logAndWrapError(boundLogger, err,
        'fetchViaLog error', 'query.error', {
          ctx: ctx,
          revisionId: revisionId
        }, next);
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
  @param {Object} ctx The logging context
  @param {Object} access The access credentials to use
  @param {sitepath} path Path of the entity you'd like to fetch
  @param {null|String} revisionId UUID of the revision, null for most recent
  @param {*} next Function that takes(err, entity)
*/
exports.entityFromPath = function(db, Entity, ctx, access, path, revisionId, next) {
  async.waterfall([
    function fetchPerm(callback) {
      if (access.context === 'STANDARD') {
        var user;
        if (access.hasOwnProperty('user')) {
          user = access.user;
        }
        exports.fetchEffectivePermissions(db, ctx, user, path, callback);
      } else if (access.context === 'ROOT') {
        return callback(null, {});
      } else if (access.context === 'USERLOOKUP') {
        return callback(null, {});
      } else {
        return logging.logAndCreateError(boundLogger,
          'entityFromPath insecure query',
          'query.insecure', {
            ctx: ctx,
            access: access
          }, callback);
      }
    },
    function fetchData(permissions, callback) {
      if (revisionId) {
        return fetchViaLog(db, Entity, ctx, access, path, revisionId, permissions, callback);
      } else {
        return fetchViaEntityTable(db, Entity, ctx, access, path, permissions, callback);
      }
    }
    ], next);
};

/**
  Fetch an entity with a given entityId
  @param {Object} db DB wrapper
  @param {*} Entity Entity class
  @param {Object} ctx The logging context
  @param {Object} access The access credentials to use
  @param {String} entityId UUID of the entity ID
  @param {null|String} revisionId UUID of the revision, null for most recent
  @param {*} next Function that takes(err, entity)
*/
exports.entityFromEntityId = function(db, Entity, ctx, access, entityId, revisionId, next) {

};

function recordQuery(db, ctx, genQuery, rowFunc) {
  var ee = new events.EventEmitter();
  var q;
  async.waterfall([
    db.connectWrap,
    function(client, done, callback) {
      q = genQuery;
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
      logging.logAndEmitWrapError(boundLogger, err,
        'recordQuery error', 'query.error', {
          ctx: ctx,
          query: q
        }, ee);
    }
    ee.emit('end');
  });

  return ee;
}

/**
 * Query for activity
 *
 * Select:
 * `child` will select any children nodes of `curpath`
 * `parents` will select all parent nodes of `curpath`
 * `dir` will select any nodes directly underneath `curpath`
 *
 * @param {Object} db The db client to use
 * @param {Object} ctx The logging context
 * @param {Object} access The access credentials to use
 * @param {SitePath} curpath The current path
 * @param {string} select `child`, `dir`, or `parents`.
 * @param {SitePath|null} userpath The user's path we are looking at
 * @param {Object} pagination The pagination paramter
 * @return {EventEmitter} an `EventEmitter` that emits the activity in `article`
 * events.
 */
exports.queryActivity = function(db, ctx, access, curpath, select, userpath, pagination) {
  boundLogger.info('queryActivity', {
    ctx: ctx,
    access: access,
    curpath: curpath,
    select: select,
    userpath: userpath
  });

  var q = exports._activityQueryGen(access, curpath.toDottedPath(), select, userpath, pagination);

  return recordQuery(db, ctx, q, function(ee, row) {
    var path = new SitePath();
    path.fromDottedPath(row.path);
    row.path = path;
    if (row.actorPath !== 'root') {
      var actorPath = new SitePath();
      actorPath.fromDottedPath(row.actorPath);
      row.actorPath = actorPath;
    }
    ee.emit('article', row);
  });
};

/**
 * Query for a node's history
 *
 * @param {Object} db The db client to use
 * @param {Object} ctx The logging context
 * @param {Object} access The access credentials to use
 * @param {SitePath} path The path to query history for
 * @param {SitePath|null} userpath The user's path we are looking at (ignored)
 * @return {EventEmitter} an `EventEmitter` that emits the activity in `article`
 * events.
 */
exports.queryHistory = function(db, ctx, access, path, userpath) {
  boundLogger.info('queryHistory', {
    ctx: ctx,
    path: path,
    access: access
  });
  var s = squel.select().from('wh_log');
  sql.searchFields(s, sql.logFields()).where('path = ?', path.toDottedPath()).order('"revisionNum"');
  var q = s.toParam();
  q.name = 'select_log_path_query';
  return recordQuery(db, ctx, q, function(ee, row) {
    var path = new SitePath();
    path.fromDottedPath(row.path);
    row.path = path;
    if (row.actorPath !== 'root') {
      var actorPath = new SitePath();
      actorPath.fromDottedPath(row.actorPath);
      row.actorPath = actorPath;
    }
    ee.emit('article', row);
  });
};

/**
 * Generate an index-feed related query.
 *
 * Select:
 * `child` will select any children nodes of `curpath`
 * `parents` will select all parent nodes of `curpath`
 * `dir` will select any nodes directly underneath `curpath`
 *
 * Filter:
 * `filter.before = new Date()` will filter everything before a date, `filter.after`
 * does the opposite.
 * `filter.protos = 'index'` will filter for anything with the `index` proto,
 * `filter.noprotos` will filter out anything with that proto.
 * `filter.navbar` will select only navbar entries
 * `filter.tag` will search for a given tag
 *
 * @param {Object} db The db client to use
 * @param {Object} ctx The logging context
 * @param {Object} access The access credentials to use
 * @param {SitePath} curpath The current path
 * @param {string} select `child`, `dir`, or `parents`.
 * @param {string} target `entity` or `count`.
 * @param {Object} filter filterng paramaters
 * @param {Object} sort `changed` or `created`
 * @param {Object} facet faceting parameters
 * @return {EventEmitter} an `EventEmitter` that emits the activity in `article`
 * events.
 */
exports.query = function(db, ctx, access, curpath, select, target, filter, sort, facet) {
  boundLogger.info('query', {
    ctx: ctx,
    curpath: curpath,
    access: access,
    select: select,
    target: target,
    filter: filter,
    sort: sort,
    facet: facet
  });
  var q = exports._queryGen(access, curpath.toDottedPath(), select, target, filter, sort, facet);
  return recordQuery(db, ctx, q, function(ee, row) {
    if (target === 'entity') {
      var path = new SitePath();
      path.fromDottedPath(row.path);
      row.path = path;
      ee.emit('article', row);
    } else if (target === 'count') {
      ee.emit('count', row);
    } else {
      logging.logAndEmitError(boundLogger,
        'recordQuery error', 'query.invalid', {
          ctx: ctx,
          details: 'target not a valid type',
          query: q
        }, ee);
    }
  });
};

/**
 * List a user's permissions
 *
 * @param {Object} db The db client to use
 * @param {Object} ctx The logging context
 * @param {Object} user The user to check
 * @return {EventEmitter} an `EventEmitter` that emits the permissions in `article`
 * events.
 */
exports.permissionsForUser = function(db, ctx, user) {
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
  return recordQuery(db, ctx, q, function(ee, row) {
    var r = {
      role: row.role,
      permission: row.permission,
      path: row.path
    };
    ee.emit('article', r);
  });
};

/**
 * List available roles.
 *
 * @param {Object} db The db client to use
 * @param {Object} ctx The logging context
 * @return {EventEmitter} an `EventEmitter` that emits the roles in `article`
 * events.
 */
exports.listRoles = function(db, ctx) {
  var s = squel.select().from('wh_permission_to_role')
   .field('role')
   .group('role');
  var q = s.toParam();
  q.name = 'list_roles';
  return recordQuery(db, ctx, q, function(ee, row) {
    var r = {
      role: row.role
    };
    r.path = new SitePath();
    r.path.fromDottedPath(row.path);
    ee.emit('article', r);
  });
};

/**
 * List a user who have a role
 *
 * @param {Object} db The db client to use
 * @param {Object} ctx The logging context
 * @param {Object} role The role to check
 * @return {EventEmitter} an `EventEmitter` that emits the users in `article`
 * events.
 */
exports.listUsersInRole = function(db, ctx, role) {
  var s = squel.select().from('wh_subject_to_roles')
   .field('subject')
   .where('role = ?', role);
  var q = s.toParam();
  q.name = 'list_users_in_role';
  return recordQuery(db, ctx, q, function(ee, row) {
    var r = {};
    r.user = new SitePath();
    r.user.fromDottedPath(row.subject);
    ee.emit('article', r);
  });
};

/**
 * List the permissions given for a role
 *
 * @param {Object} db The db client to use
 * @param {Object} ctx The logging context
 * @param {Object} role The role to check
 * @return {EventEmitter} an `EventEmitter` that emits the permission in `article`
 * events.
 */
exports.listPermissionsInRole = function(db, ctx, role) {
  var s = squel.select().from('wh_permission_to_role')
   .field('permission')
   .field('path')
   .where('role = ?', role);
  var q = s.toParam();
  q.name = 'list_permissions_in_role';
  return recordQuery(db, ctx, q, function(ee, row) {
    var r = {
      permission: row.permission,
      path: row.path
    };
    ee.emit('article', r);
  });
};
