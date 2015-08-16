var SitePath = require ('./sitepath');
var events = require("events");
var async = require('async');

function resultsToIndexFeed(protoset, response) {
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
    var article = protoset.decorateListing(r);
    ee.emit('article', article);
  });
  response.on('end', function() {
    ee.emit('end');
  });

  return ee;
}

function addIdx(response) {
  var ee = new events.EventEmitter();
  var idx = 0;
  response.on('error', function(err) {
    ee.emit('error', err);
  });
  response.on('article', function(article) {
    article.$idx = idx;
    ee.emit('article', article);
    idx = idx + 1;
  });
  response.on('end', function() {
    ee.emit('end');
  });

  return ee;
}

function emitEventsWithIdx(chunk, context, bodies, resp) {
  var body = bodies.block;
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
}

function emitDirectBlockWithIdx(req, resp, next) {
  var str = '';
  var arts = [];
  resp.on('article', function(article) {
    arts.push(article);
  });
  resp.on('error', function(err) {
    return next(err);
  });
  resp.on('end', function() {
    async.reduce(arts, str, function(memo, data, callback) {
      req.scheme.renderSync('partials-list', data, function(err, out) {
        if (err) {
          return callback(err);
        }
        callback(null, memo + out);
      });
    }, function(err, result) {
      if (err) {
        return next(err);
      }
      return next(err, {format: 'html', htmltext: result + ''});
    });
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
      var protoset = context.get('protoset');
      var security = context.get('security');
      var ctx = context.get('ctx');
      var qr = query.query(db, ctx, security, path, 'dir', 'entity', filter,
        undefined, undefined);
      var resp = addIdx(resultsToIndexFeed(protoset, qr));
      emitEventsWithIdx(chunk, context, bodies, resp);
    });
  };
}

function renderDirectIndexFeed(req, query, view, block, next) {
  var db = req.db;
  var path = new SitePath(view.meta.sitePath);
  var curpath = block.curpath;
  var rootpath = block.rootpath;
  if (curpath) {
    path = new SitePath(view.meta.sitePath);
  }
  if (rootpath) {
    path = new SitePath(['wh']);
  }
  var filter = {};
  var navbar = block.navbar;
  if (navbar) {
    filter.navbar = true;
  }
  var ctx = view.ctx;
  var qr = query.query(db, ctx, req.access, path, block.query,
    'entity', filter, undefined, undefined);
  var resp = addIdx(resultsToIndexFeed(req.protoset, qr));
  return emitDirectBlockWithIdx(req, resp, next);
}

exports.installDust = installDust;
exports.resultsToIndexFeed = resultsToIndexFeed;
exports.renderDirectIndexFeed = renderDirectIndexFeed;
