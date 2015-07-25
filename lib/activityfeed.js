var SitePath = require ('./sitepath');
var events = require("events");

function installDust(dust, db, query) {
  dust.helpers.activityActor = function(chunk, context, bodies, params) {
    var actor = context.resolve(params.key);
    if (typeof actor === 'string') {
      return chunk.write(actor);
    }
    if (actor.hasOwnProperty('objectType') && actor.objectType === 'site') {
      return chunk.write('root');
    }
    var displayName = 'unknown';
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
  dust.helpers.activityVerb = function(chunk, context, bodies, params) {
    var verb = context.resolve(params.key);
    return chunk.write(verb);
  };
  dust.helpers.activityObject = function(chunk, context, bodies, params) {
    var object = context.resolve(params.key);
    if (typeof object === 'string') {
      return chunk.write(object);
    }
    var displayName = 'unknown object';
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
