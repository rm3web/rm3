var SitePath = require ('./sitepath');
var events = require("events");

function resultsToIndexFeed(response) {
  var ee = new events.EventEmitter();
  response.on('error', function(err) {
    ee.emit('error', err);
  });
  response.on('article', function(row) {
    var r = {};
    r.title = row.summary.title;
    r.summary = row.summary.abstract;
    r.guid = row.entityId;
    r.pubdate = row.created;
    r.date = row.modified;
    r.path = row.path;
    r.meta = {};
    r.meta['rm3:proto'] = row.proto;
    ee.emit('article', r);
  });
  response.on('end', function() {
    ee.emit('end');
  });

  return ee;
}

function emitEventsWithIdx(chunk, context, bodies, resp) {
  var protoset = context.get('protoset');
  var body = bodies.block;
  var idx = 0;
  resp.on('article', function(article) {
    protoset.decorateListing(article);
    article.$idx = idx;
    chunk.render(body, context.push(article));
    idx = idx + 1;
  });
  resp.on('error', function(err) {
    chunk.end();
  });
  resp.on('end', function() {
    chunk.end();
  });
}

function installDust(dust, db, query) {
  dust.helpers.titleLink = function(chunk, context, bodies, params) {
    var path = context.get('path').toUrl('/', 1);
    var title = context.get('title');
    var linkrel = context.resolve(params.rel);
    var rel = "";
    if (linkrel) {
      rel = 'rel = "' + linkrel + '" ';
    }
    return chunk.write('<a ' + rel + 'href="' + path + '">' + title + "</a>");
  };

  dust.helpers.basicQuery = function(chunk, context, bodies, params) {
    return chunk.map(function(chunk) {
      var path = context.get('path');
      var curpath = context.resolve(params.curpath);
      var rootpath = context.resolve(params.rootpath);
      if (curpath) {
        path = context.get('path');
      }
      if (rootpath) {
        path = new SitePath(['wh']);
      }
      var filter = {};
      var navbar = context.resolve(params.navbar);
      if (navbar) {
        filter.navbar = true;
      }
      var security = context.get('security');
      var ctx = context.get('ctx');
      var qr = query.query(db, ctx, security, path, 'dir', 'entity', filter,
        undefined, undefined);
      var resp = resultsToIndexFeed(qr);
      emitEventsWithIdx(chunk, context, bodies, resp);
    });
  };
}

exports.installDust = installDust;
exports.resultsToIndexFeed = resultsToIndexFeed;
