var SitePath = require ('sitepath');
var events = require("events");
var addIdx = require('./articlelists').addIdx;
var Pagination = require('./pagination');

/**
* @overview The Activity Feed is the list of events for a user or a node.
* It is based off of W3C Working Draft 06 October 2015 of Activity Streams
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
 * @param {Object} site The site object
 * @param {string | undefined} objRevisionId The object's revision ID, if known
 * @param {Object | undefined} objSummary The object's revision ID, if known
 * @param {string | undefined} objProto The object's proto, if known
 * @return {EventEmitter} An EventEmitter that emits `article` events for
 * each translated event and `end` when it's complete.
 */
function logToActivityFeed(response, site, objRevisionId, objSummary, objProto) {
  var ee = new events.EventEmitter();
  response.on('error', function(err) {
    ee.emit('error', err);
  });
  response.on('article', function(article) {
    var activity = {
      object: {
        url: site.sitePathToUrl(article.path),
        '@id': "urn:" + article.path.toDottedPath(),
        'rm3:rootUrl': site.sitePathToUrl(article.path)
      },
      '@type': article.evtClass,
      updated: article.evtTouched,
      startTime: article.evtStart,
      endTime: article.evtEnd,
      "rm3:revisionNum": article.revisionNum,
      "rm3:revisionId": article.revisionId,
      "rm3:evtFinal": article.evtFinal,
      '@id': 'urn:' + article.revisionId + ":" + article.revisionNum
    };
    var orId;
    if (article.objRevisionId) {
      orId = article.objRevisionId;
    } else {
      orId = objRevisionId;
    }
    var proto;
    if (article.objProto) {
      proto = article.objProto;
    } else {
      proto = objProto;
    }
    var summary;
    if (article.objSummary) {
      summary = article.objSummary;
    } else {
      summary = objSummary;
    }
    if (orId !== article.revisionId) {
      activity.object.url = site.sitePathToUrl(article.path) + '?revisionId=' +
        article.revisionId;
    }

    if (article.objProto) {
      activity.object['rm3:proto'] = proto;
    }
    if (summary && summary.hasOwnProperty('title')) {
      activity.object.displayName = summary.title;
    }
    if (article.evtFinal) {
      activity.published = article.evtEnd;
    }
    if (article.actorPath === 'root') {
      activity.actor = {
        "@type": "http://rm3.wirewd.com/Site",
        "id": "urn:root"
      };
    } else {
      activity.actor = {
        '@type': "Person",
        '@id': "urn:" + article.actorPath.toDottedPath(),
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

function renderDirectJsonPayload(query, db, ctx, security, path, site, revisionId, permissions, next) {
  var filter = {};

  if (!permissions.hasOwnProperty('viewdraft')) {
    filter.drafts = false;
  }
  var qr = query.queryHistory(db, ctx, security, path, undefined, filter);

  var resp = logToActivityFeed(qr, site, revisionId);

  var items = [];
  resp.on('article', function(article) {
    items.push(article);
  });
  resp.on('error', function(err) {
    next(err);
  });
  resp.on('end', function() {
    next(null, {"@context": ["http://www.w3.org/ns/activitystreams", {
      rm3: "http://rm3.example.org/#"
    }], items: items});
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
   *
   * @param {*} chunk Dust chunk
   * @param {*} context Dust context
   * @param {*} bodies Child bodies from Dust
   * @param {*} params Params from Dust
   * @return {void}
   */
  dust.helpers.activityActor = function(chunk, context, bodies, params) {
    var actor = context.resolve(params.key);
    if (typeof actor === 'string') {
      return chunk.write(actor);
    }
    // This is the rm3-specific definition of actions taken without an
    // associated user on behalf of the site (e.g. creating nodes before
    // there's users created)
    if (actor.hasOwnProperty('@type') && actor['@type'] === 'http://rm3.wirewd.com/Site') {
      return chunk.write('root');
    }
    var displayName = 'unknown'; // This is the fall-through for name
    if (actor.hasOwnProperty('displayName')) {
      displayName = actor.displayName;
    } else if (actor.hasOwnProperty('@id')) {
      displayName = actor['@id'];
    }
    if (actor.hasOwnProperty('url')) {
      return chunk.write('<a href="' + actor.url + '">' + displayName + "</a>");
    }
    return chunk.write(displayName);
  };

  /**
   * Interpolate the actor part of an activity feed.
   *
   * Usage example: `{@activityActor key=rec.actor /}`
   * key is the Dust key to interpret
   *
   * @param {*} chunk Dust chunk
   * @param {*} context Dust context
   * @param {*} bodies Child bodies from Dust
   * @param {*} params Params from Dust
   * @return {void}
   */
  dust.helpers.activityId = function(chunk, context, bodies, params) {
    var id = context.get("rm3:revisionId");

    return chunk.write(id);
  };

  /**
   * Interpolate the actor part of an activity feed.
   *
   * Usage example: `{@activityActor key=rec.actor /}`
   * key is the Dust key to interpret
   *
   * @param {*} chunk Dust chunk
   * @param {*} context Dust context
   * @param {*} bodies Child bodies from Dust
   * @param {*} params Params from Dust
   * @return {void}
   */
  dust.helpers.activityBareUrl = function(chunk, context, bodies, params) {
    var obj = context.get("object");

    return chunk.write(obj['rm3:rootUrl']);
  };

  /**
   * Interpolate the verb part of an activity feed.
   *
   * Usage example: `{@activityVerb key=rec.verb /}`
   * key is the Dust key to interpret
   *
   * @param {*} chunk Dust chunk
   * @param {*} context Dust context
   * @param {*} bodies Child bodies from Dust
   * @param {*} params Params from Dust
   * @return {void}
   */
  dust.helpers.activityVerb = function(chunk, context, bodies, params) {
    var verb = context.get('@type');
    return chunk.write(verb);
  };

  /**
   * Interpolate the verb part of an activity feed.
   *
   * Usage example: `{@activityVerb key=rec.verb /}`
   * key is the Dust key to interpret
   *
   * @param {*} chunk Dust chunk
   * @param {*} context Dust context
   * @param {*} bodies Child bodies from Dust
   * @param {*} params Params from Dust
   * @return {void}
   */
  dust.helpers.activityDid = function(chunk, context, bodies, params) {
    var isFinal = context.get('rm3:evtFinal');
    if (isFinal) {
      return chunk.write('did');
    } else {
      return chunk.write('posted a draft to do');
    }
  };

  /**
   * Interpolate the object part of an activity feed.
   *
   * Usage example: `{@activityObject key=rec.object /}`
   * key is the Dust key to interpret
   *
   * @param {*} chunk Dust chunk
   * @param {*} context Dust context
   * @param {*} bodies Child bodies from Dust
   * @param {*} params Params from Dust
   * @return {void}
   */
  dust.helpers.activityObject = function(chunk, context, bodies, params) {
    var object = context.resolve(params.key);
    if (typeof object === 'string') {
      return chunk.write(object);
    }
    var displayName = 'unknown object'; // This is the fall-through
    if (object.hasOwnProperty('displayName')) {
      displayName = object.displayName;
    } else if (object.hasOwnProperty('@id')) {
      displayName = object['@id'];
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
      var summary = context.get('summary');
      var proto = context.get('meta.proto');

      var permissions = context.get('permissions');
      var filter = {};

      if (!permissions.hasOwnProperty('viewdraft')) {
        filter.drafts = false;
      }

      var qr = query.queryHistory(db, ctx, security, path, undefined, filter);
      var body = bodies.block;

      var resp = addIdx(logToActivityFeed(qr, site, revisionId, summary, proto));

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

      var filter = {};
      var drafts = context.resolve(params.drafts);
      var needsReview = context.resolve(params.needsReview);

      if (drafts) {
        filter.drafts = (drafts === 'true');
      }

      if (needsReview) {
        filter.needsReview = (needsReview === 'true');
      }

      if (params.userPath) {
        basePath = context.resolve(params.userPath);
        if (typeof basePath === 'string') {
          userPath = new SitePath(basePath);
        } else {
          userPath = basePath;
        }
      }

      if (params.basePath) {
        basePath = context.resolve(params.basePath);
        if (typeof basePath === 'string') {
          path = new SitePath(basePath);
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

      var qr = query.queryActivity(db, ctx, security, path, 'child', userPath, filter, pagination);
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
