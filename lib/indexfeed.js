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
    r['rm3:proto'] = row.proto;
    ee.emit('article', r);
  });
  response.on('end', function() {
    ee.emit('end');
  });

  return ee;
}

function installDust(dust, db, query) {
  dust.helpers.basicQuery = function(chunk, context, bodies, params) {
    return chunk.map(function(chunk) {
      var path = context.get('path');
      var security = context.get('security');
      var ctx = context.get('ctx');
      var qr = query.query(db, ctx, security, path, 'dir', 'entity', {},
        undefined, undefined);
      var idx = 0;
      var resp = resultsToIndexFeed(qr);
      resp.on('article', function(article) {
        chunk.render(bodies.block, context.push(
          {path: article.path.toUrl('/', 1),
           article: article,
           '$idx': idx}));
        idx = idx + 1;
      });
      resp.on('error', function(err) {
        chunk.end();
      });
      resp.on('end', function() {
        chunk.end();
      });
    });
  };

  dust.helpers.navbarQuery = function(chunk, context, bodies, params) {
    return chunk.map(function(chunk) {
      var path = new SitePath(['wh']);
      var security = context.get('security');
      var ctx = context.get('ctx');
      var qr = query.query(db, ctx, security, path, 'dir', 'entity',
        {'navbar': true}, undefined, undefined);
      var body = bodies.block;
      var idx = 0;
      var resp = resultsToIndexFeed(qr);
      resp.on('article', function(article) {
        chunk.render(bodies.block, context.push(
          {path: article.path.toUrl('/', 1),
           article: article,
           '$idx': idx}));
        idx = idx + 1;
      });
      resp.on('error', function(err) {
        chunk.end();
      });
      resp.on('end', function() {
        chunk.end();
      });
    });
  };
}

exports.installDust = installDust;
exports.resultsToIndexFeed = resultsToIndexFeed;
