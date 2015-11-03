var SitePath = require ('./sitepath');
var events = require("events");
var addIdx = require('./articlelists').addIdx;
var Pagination = require('./pagination');

/**
* @overview The Activity Feed is the list of events for a user or a node.
* It is based off of W3C Working Draft 22 July 2015 of Activity Streams
* 2.0, with some adjustments for passing rm3-specific information around.
*
* This should probably work on other arbitrary JSON-format Activity Feed
* 2.0 messages, but is mostly intended for rm3-specific data.
*
* Any rm3-specific JSON keys are prefixed with `rm3:`
*
* @title Activity Feed
* @module activityfeed
*/

/**
 * Convert a log (from query.queryActivity) into an activity feed
 * @param {EventEmitter} response The EventEmitter from queryActivity that
 * should be translated into activity feed records.
 * @returns {EventEmitter} An EventEmitter that emits `article` events for
 * each translated event and `end` when it's complete.
 */
function logToActivityFeed(response, site, objRevisionId) {
  var ee = new events.EventEmitter();
  response.on('error', function(err) {
    ee.emit('error', err);
  });
  response.on('article', function(article) {
    var activity = {
      object: {
        url: site.sitePathToUrl(article.path),
        id: "urn:" + article.path.toDottedPath()
      },
      verb: article.evtClass,
      updated: article.evtTouched,
      startTime: article.evtStart,
      endTime: article.evtEnd,
      "rm3:revisionNum": article.revisionNum,
      "rm3:revisionId": article.revisionId,
      id: 'urn:' + article.revisionId + ":" + article.revisionNum
    };
    var orId;
    if (article.objRevisionId) {
      orId = article.objRevisionId;
    } else {
      orId = objRevisionId;
    }
    if (orId !== article.revisionId) {
      activity.object.url = site.sitePathToUrl(article.path) + '?revisionId=' +
        article.revisionId;
    }
    if (article.objProto) {
      activity.object['rm3:proto'] = article.objProto;
    }
    if (article.objSummary && article.objSummary.hasOwnProperty('title')) {
      activity.object.displayName = article.objSummary.title;
    }
    if (article.evtFinal) {
      activity.published = article.evtEnd;
    }
    if (article.actorPath === 'root') {
      activity.actor = {
        "objectType": "site",
        "id": "urn:root"
      };
    } else {
      activity.actor = {
        objectType: "person",
        id: "urn:" + article.actorPath.toDottedPath(),
        url: site.sitePathToUrl(article.actorPath)
      };
      if (article.actorProto) {
        activity.actor['rm3:proto'] = article.actorProto;
      }
      if (article.actorSummary && article.actorSummary.hasOwnProperty('title')) {
        activity.actor.displayName = article.actorSummary.title;
      }
    }
    ee.emit('article', activity);
  });
  response.on('end', function() {
    ee.emit('end');
  });

  return ee;
}

function renderDirectJsonPayload(query, db, ctx, security, path, site, revisionId, next)
{
  var qr = query.queryHistory(db, ctx, security, path);

  var resp = logToActivityFeed(qr, site, revisionId);

  var items = [];
  resp.on('article', function(article) {
    items.push(article);
  });
  resp.on('error', function(err) {
    next(err);
  });
  resp.on('end', function() {
    next(null, {items: items})
  });
}

/**
 * Install Dust helpers for the Activity feed.
 * @param {*} dust Dust instance
 * @param {*} db Database instance
 * @param {*} query Query instance
 */
function installDust(dust, db, query) {
  /**
   * Interpolate the actor part of an activity feed.
   *
   * Usage example: `{@activityActor key=rec.actor /}`
   * key is the Dust key to interpret
   */
  dust.helpers.activityActor = function(chunk, context, bodies, params) {
    var actor = context.resolve(params.key);
    if (typeof actor === 'string') {
      return chunk.write(actor);
    }
    // This is the rm3-specific definition of actions taken without an
    // associated user on behalf of the site (e.g. creating nodes before
    // there's users created)
    if (actor.hasOwnProperty('objectType') && actor.objectType === 'site') {
      return chunk.write('root');
    }
    var displayName = 'unknown'; // This is the fall-through for name
    if (actor.hasOwnProperty('displayName')) {
      displayName = actor.displayName;
    } else if (actor.hasOwnProperty('id')) {
      displayName = actor.id;
    }
    if (actor.hasOwnProperty('url')) {
      return chunk.write('<a href="' + actor.url + '">' + displayName + "</a>");
    }
    return chunk.write(displayName);
  };

  /**
   * Interpolate the verb part of an activity feed.
   *
   * Usage example: `{@activityVerb key=rec.verb /}`
   * key is the Dust key to interpret
   */
  dust.helpers.activityVerb = function(chunk, context, bodies, params) {
    var verb = context.resolve(params.key);
    return chunk.write(verb);
  };

  /**
   * Interpolate the object part of an activity feed.
   *
   * Usage example: `{@activityObject key=rec.object /}`
   * key is the Dust key to interpret
   */
  dust.helpers.activityObject = function(chunk, context, bodies, params) {
    var object = context.resolve(params.key);
    if (typeof object === 'string') {
      return chunk.write(object);
    }
    var displayName = 'unknown object'; // This is the fall-through
    if (object.hasOwnProperty('displayName')) {
      displayName = object.displayName;
    } else if (object.hasOwnProperty('id')) {
      displayName = object.id;
    }
    if (object.hasOwnProperty('url')) {
      return chunk.write('<a href="' + object.url + '">' + displayName + "</a>");
    }
    return chunk.write(displayName);
  };

  dust.helpers.history = function(chunk, context, bodies, params) {
    return chunk.map(function(chunk) {
      var path = context.get('path');
      var security = context.get('security');
      var site = context.get('site');
      var revisionId = context.get('meta.revisionId');
      var ctx = context.get('ctx');

      var qr = query.queryHistory(db, ctx, security, path);
      var body = bodies.block;

      var resp = addIdx(logToActivityFeed(qr, site, revisionId));

      var idx = 0;
      resp.on('article', function(article) {
        chunk.render(body, context.push(article));
      });
      resp.on('error', function(err) {
        chunk.end();
      });
      resp.on('end', function() {
        chunk.end();
      });
    });
  };

  dust.helpers.activityFeed = function(chunk, context, bodies, params) {
    return chunk.map(function(chunk) {
      var pagePath = context.get('path');
      var security = context.get('security');
      var site = context.get('site');
      var userPath, basePath;
      var ctx = context.get('ctx');
      var baseurl = ['wh'];
      var path = new SitePath(baseurl);
      var paginationKey = context.resolve(params.paginationKey);
      var paginationLimit = context.resolve(params.paginationLimit);
      var pagination = Pagination.generatePagination(paginationLimit);

      if (params.userPath) {
        basePath = context.resolve(params.userPath);
        if (typeof basePath === 'string') {
          userPath.fromDottedPath(basePath);
        } else {
          userPath = basePath;
        }
      }

      if (params.basePath) {
        basePath = context.resolve(params.basePath);
        if (typeof basePath === 'string') {
          path.fromDottedPath(basePath);
        } else {
          path = basePath;
        }
      }

      Pagination.parsePath(pagination,paginationKey,
        pagePath.partial, function(pagination, memento) {
          if (memento.length >= 3) {
            pagination.startDate = new Date(memento[1]);
            pagination.startNum = parseInt(memento[2],10);
            pagination.startId = memento[3];
          }
        });

      var qr = query.queryActivity(db, ctx, security, path, 'child', userPath, pagination);
      var body = bodies.block;

      if (bodies.begin) {
        chunk.render(bodies.begin, context);
      }
      var idxFeed = addIdx(logToActivityFeed(qr, site));
      var resp = Pagination.generateLastLink(idxFeed, pagination);
      var idx = 0;
      var lastArt = {};
      resp.on('article', function(article) {
        chunk.render(body, context.push(article));
      });
      resp.on('error', function(err) {
        chunk.end();
      });
      resp.on('more', function(more) {
        if (bodies.end) {
          chunk.render(bodies.end, context);
        }
        if (more) {
          var pKey = Pagination.generatePageLink(paginationKey,
            pagination, [more.endTime.toISOString(), more["rm3:revisionNum"],
              more["rm3:revisionId"]]);
          chunk.write('<a href="' + site.sitePathToUrl(pagePath) +
              '$/' + pKey + '">next</a>');
        }
      });
      resp.on('end', function() {
        chunk.end();
      });
    });
  };
}

exports.installDust = installDust;
exports.logToActivityFeed = logToActivityFeed;
exports.renderDirectJsonPayload = renderDirectJsonPayload;