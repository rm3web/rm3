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
    if (actor.hasOwnProperty('url')) {
      return chunk.write('<a href="' + actor.url + '">' + actor.id + "</a>");
    }
    return chunk.write(actor.id);
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
    if (object.hasOwnProperty('url')) {
      return chunk.write('<a href="' + object.url + '">' + object.id + "</a>");
    }
    return chunk.write(object.id);
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
    if (article.evtFinal) {
      activity.published = article.evtEnd;
    }
    if (article.actorPath === 'root') {
      activity.actor = {
        "objectType": "site",
        "id": "urn:root"
      };
    } else {
      var path = new SitePath();
      path.fromDottedPath(article.actorPath);
      activity.actor = {
        objectType: "person",
        id: "urn:" + article.actorPath,
        url: path.toUrl('/', 1)
      };
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
