var SitePath = require ('./sitepath');
var events = require("events");
var async = require('async');
var validator = require('validator');
/**
* @overview The Index Feed is a list of nodes on the site.
* It is based off of Atom and https://github.com/danmactough/node-feedparser
* with some adjustments for passing rm3-specific information around.
*
* This should probably work on other arbitrary JSON-format node-feedparser
* feeds, but is mostly intended for rm3-specific data.
*
* Any rm3-specific JSON keys are prefixed with `rm3:`
*
* @title Index Feed
* @module indexfeed
*/

/**
 * Convert a response (from query.query) into an index feed
 * @param {Object} protoset The ProtoSet to decorate with
 * @param {EventEmitter} response The EventEmitter from query that
 * should be translated into index feed records
 * @returns {EventEmitter} An EventEmitter that emits `article` events for
 * each translated entry and `end` when it's complete.
 */
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
    var article;
    if (protoset) {
      article = protoset.decorateListing(r);
    } else {
      article = r;
    }
    ee.emit('article', article);
  });
  response.on('end', function() {
    ee.emit('end');
  });

  return ee;
}

/*
 * Add `$idx` paramaters to the response.
 */
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

/*
 * Dust helper to emit a bunch of objects in Dust.
 */
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

/*
 * Dust helper to emit a bunch of objects directly but use Dust.
 */
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
    req.scheme.renderSync('partials/list', {site: req.site, data: arts}, function(err, out) {
      if (err) {
        return next(err);
      }
      next(null, {format: 'htm', htmltext: out});
    });
  });
}

/**
 * Install Dust helpers for the Index feed
 * @param {*} dust Dust instance
 * @param {*} db Database instance
 * @param {*} query Query instance
 */
function installDust(dust, db, query) {
  /**
   * Interpolate the title and URL
   *
   * Usage example: `{@titleLink rel="bookmark" /}`
   * rel is the relative link to add
   */
  dust.helpers.titleLink = function(chunk, context, bodies, params) {
    var site = context.get('site');
    var path = site.sitePathToUrl(context.get('path'));
    var title = context.get('title');
    var linkrel = context.resolve(params.rel);
    var rel = "";
    if (linkrel) {
      rel = 'rel = "' + linkrel + '" ';
    }
    return chunk.write('<a ' + rel + 'href="' + path + '">' + title + "</a>");
  };

  /**
   * Interpolate the title and URL
   *
   * Usage example:
   * `{@basicQuery}`
   * `<li>{@titleLink/}</li>`
   * `{/basicQuery}`
   *
   * rootpath="true" will query based on root, otherwise it will
   * query based on the current path.
   * navbar="true" will filter and only show entities with the navbar tag.
   */

  dust.helpers.basicQuery = function(chunk, context, bodies, params) {
    return chunk.map(function(chunk) {
      var pageCurPath = context.get('path');
      var path = pageCurPath;
      var rootPath = context.resolve(params.rootPath);
      if (rootPath) {
        path = new SitePath(['wh']);
      }
      var filter = {};
      var navbar = context.resolve(params.navbar);
      if (navbar) {
        filter.navbar = true;
      }
      var tagPathSearch = context.resolve(params.tagPathSearch);
      if (tagPathSearch) {
        filter.tag = validator.stripLow(pageCurPath.partial[0]);
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

/**
 * Directly render an index.
 * @param {Object} req The request
 * @param {Object} query The query object
 * @param {Object} view The JSON view
 * @param {Object} block the textblock
 * @param {Function} next The next function to call, takes (err, textblock)
 */
function renderDirectIndexFeed(req, query, view, block, next) {
  var db = req.db;
  var path = new SitePath(view.meta.sitePath);
  var rootPath = block.rootPath;
  if (rootPath) {
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
