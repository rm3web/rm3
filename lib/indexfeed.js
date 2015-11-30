var SitePath = require ('./sitepath');
var events = require("events");
var async = require('async');
var validator = require('validator');
var Pagination = require('./pagination');
var addIdx = require('./articlelists').addIdx;
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
 * @param {Object} scheme The scheme to use to decorate the index feed with extra
 * metadata like icons
 * @param {Object} site The site object to use for URL mapping
 * @param {EventEmitter} response The EventEmitter from query that
 * should be translated into index feed records
 * @returns {EventEmitter} An EventEmitter that emits `article` events for
 * each translated entry and `end` when it's complete.
 */
function resultsToIndexFeed(protoset, scheme, site, response) {
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
      article = protoset.decorateListing(r, row, scheme, site);
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
function emitDirectBlockWithIdx(req, block, pagination, paginationKey, partial, resp, next) {
  var str = '';
  var arts = [];
  var moreLink = '';
  resp.on('article', function(article) {
    arts.push(article);
  });
  resp.on('error', function(err) {
    return next(err);
  });
  resp.on('more', function(more) {
    if (more) {
      var token;
      if (block.sort === 'changed') {
        token = [more.date, more.guid];
      } else if (block.sort === 'created') {
        token = [more.pubdate, more.guid];
      } else {
        token = [more.path.toDottedPath().replace(/_/g,'-'), more.guid];
      }
      var pKey = Pagination.generatePageLink(paginationKey,
          pagination, token);
      moreLink = '<a href="' + req.site.sitePathToUrl(req.sitepath) +
          '$/' + pKey + '">next</a>';
    }
  });
  resp.on('end', function() {
    req.scheme.renderSync(partial, {site: req.site, data: arts, moreLink: moreLink}, function(err, out) {
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

  dust.helpers.authorLink = function(chunk, context, bodies, params) {
    var defaultAuthorName = context.get('author');
    var betterAuthorName = context.get('meta.atom:author.name');
    var authorUri = context.get('meta.atom:author.uri');

    if (authorUri) {
      chunk.write('<a href="' + authorUri + '">' )
    }
    chunk.write(betterAuthorName || defaultAuthorName)
    if (authorUri) {
      chunk.write('</a>');
    }
  };

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
    var linkstyle = context.resolve(params.linkstyle);
    var linkclass = context.resolve(params.linkclass);
    var rel = "";
    if (linkrel) {
      rel = 'rel = "' + linkrel + '" ';
    }
    if (linkstyle) {
      rel = rel + 'style = "' + linkstyle + '" ';
    }
    if (linkclass) {
      rel = rel + 'class = "' + linkclass + '" ';
    }
    chunk.write('<a ' + rel + 'href="' + path + '">');
    if (bodies.before) {
      chunk.render(bodies.before, context);
    }
    chunk.write(title);
    if (bodies.after) {
      chunk.render(bodies.after, context);
    }
    chunk.write('</a>');
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
      var scheme = context.get('scheme');
      var site = context.get('site');
      var path = pageCurPath;
      var rootPath = context.resolve(params.rootPath);
      var pagination = {};
      if (rootPath) {
        path = new SitePath(['wh']);
      }
      var filter = {};
      var navbar = context.resolve(params.navbar);
      if (navbar) {
        filter.navbar = true;
      }
      var comment = context.resolve(params.comment);
      if (comment) {
        filter.comment = true;
      }
      var tagPathSearch = context.resolve(params.tagPathSearch);
      if (tagPathSearch) {
        filter.tag = validator.stripLow(pageCurPath.partial[0]);
      }
      var select = 'dir';
      var selectParam = context.resolve(params.select);
      if (selectParam) {
        select = selectParam;
      }
      var protoset = context.get('protoset');
      var security = context.get('security');
      var ctx = context.get('ctx');
      var qr = query.query(db, ctx, security, path, select, 'entity', filter,
        undefined, undefined, pagination);
      var resp = addIdx(resultsToIndexFeed(protoset, scheme, site, qr));
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
 * @param {string} pos the position of this block for pagination
 * @param {Function} next The next function to call, takes (err, textblock)
 */
function renderDirectIndexFeed(req, query, view, block, pos, next) {
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
  var paginationKey = pos;
  var paginationLimit = 5;
  var pagination = Pagination.generatePagination(paginationLimit);

  Pagination.parsePath(pagination,paginationKey,
    req.sitepath.partial, function(pagination, memento) {
      if (memento.length >= 2) {
        if (block.sort === 'changed') {
          pagination.token = new Date(memento[1]);
          pagination.entityId = memento[2];
        } else if (block.sort === 'created') {
          pagination.token = new Date(memento[1]);
          pagination.entityId = memento[2];
        } else {
          pagination.token = new SitePath();
          pagination.token.fromDottedPath(memento[1].replace(/-/g,'_'));
          pagination.entityId = memento[2];
        }
      }
    });

  var partials = {list: true, grid: true, card: true};
  var partial = 'partials/card';
  if (block.partial) {
    if (partials.hasOwnProperty(block.partial)) {
      partial = "partials/" + block.partial;
    }
  }

  var ctx = view.ctx;
  var qr = query.query(db, ctx, req.access, path, block.query,
    'entity', filter, undefined, undefined, pagination);
  var idxFeed = addIdx(resultsToIndexFeed(req.protoset, req.scheme, req.site, qr));
  var resp = Pagination.generateLastLink(idxFeed, pagination);
  return emitDirectBlockWithIdx(req, block, pagination, paginationKey, partial, resp, next);
}

exports.installDust = installDust;
exports.resultsToIndexFeed = resultsToIndexFeed;
exports.renderDirectIndexFeed = renderDirectIndexFeed;
