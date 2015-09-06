var SitePath = require ('./sitepath');
var events = require("events");

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
}

/**
 * Convert a log (from query.queryActivity) into an activity feed
 * @param {EventEmitter} response The EventEmitter from queryActivity that
 * should be translated into activity feed records.
 * @returns {EventEmitter} An EventEmitter that emits `article` events for
 * each translated event and `end` when it's complete.
 */
function logToActivityFeed(response) {
  var ee = new events.EventEmitter();
  response.on('error', function(err) {
    ee.emit('error', err);
  });
  response.on('article', function(article) {
    var activity = {
      object: {
        url: article.path.toUrl('/', 1),
        id: "urn:" + article.path.toDottedPath()
      },
      verb: article.evtClass,
      updated: article.evtTouched,
      startTime: article.evtStart,
      endTime: article.evtEnd,
      id: 'urn:' + article.revisionId + ":" + article.revisionNum
    };
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
        url: article.actorPath.toUrl('/', 1)
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

exports.installDust = installDust;
exports.logToActivityFeed = logToActivityFeed;
