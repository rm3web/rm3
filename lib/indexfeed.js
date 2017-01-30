var SitePath = require ('sitepath');
var events = require("events");
var async = require('async');
var validator = require('validator');
var Pagination = require('./pagination');
var addIdx = require('./articlelists').addIdx;
var LinkedDataBox = require('linked-data-box').LinkedDataBox;
var dotty = require("dotty");
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

function parseFacetPath(partial, paginationKey, filter) {
  var facet = false;
  if (partial) {
    var partialKeyStart = partial.indexOf(paginationKey + '_yearmonth');
    if (partialKeyStart !== -1) {
      var memento = partial[partialKeyStart + 1].split('_');
      var yearMonth = new Date(memento[0], memento[1] - 1, 1);
      filter.yearMonth = yearMonth;
      facet = true;
    }
    partialKeyStart = partial.indexOf(paginationKey + '_pred');
    if (partialKeyStart !== -1) {
      var pred = partial[partialKeyStart + 1];
      filter.predicate = pred;
      facet = true;
    }
    partialKeyStart = partial.indexOf(paginationKey + '_tag');
    if (partialKeyStart !== -1) {
      var tag = partial[partialKeyStart + 1];
      filter.tag = tag;
      facet = true;
    }
  }
  return facet;
}

/**
 * Convert a response (from query.query) into an index feed
 * @param {Object} ctx The context
 * @param {Object} protoset The ProtoSet to decorate with
 * @param {Object} scheme The scheme to use to decorate the index feed with extra
 * metadata like icons
 * @param {Object} site The site object to use for URL mapping
 * @param {Object} blobstores the blobstore
 * @param {EventEmitter} response The EventEmitter from query that
 * should be translated into index feed records
 * @return {EventEmitter} An EventEmitter that emits `article` events for
 * each translated entry and `end` when it's complete.
 */
function resultsToIndexFeed(ctx, protoset, scheme, site, blobstores, response) {
  var ee = new events.EventEmitter();
  var arts = [];
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
    r.tags = new LinkedDataBox(row.tags);
    arts.push({r: r, row:row});
  });
  response.on('end', function() {
    async.each(arts,function(r, callback) {
      if (protoset) {
        protoset.decorateListing(ctx, r.r, r.row, scheme, site, blobstores, function(err, decoratedArticle) {
          ee.emit('article', decoratedArticle);
          callback(err);
        });
      } else {
        callback();
        ee.emit('article', r.r);
      }
    }, function(err) {
      ee.emit('end');
    });
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
    article.idx = idx;
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

function mergeFacet(queryResponse, facetResponse, facetName, dates, facetKey, site, sitepath, sort, paginationKey) {
  var ee = new events.EventEmitter();
  var queryDone = false;
  var facetDone = false;
  var count = [];
  queryResponse.on('article', function(article) {
    ee.emit('article', article);
  });
  queryResponse.on('error', function(err) {
    ee.emit('error', err);
  });
  queryResponse.on('more', function(more) {
    ee.emit('more', more);
  });
  queryResponse.on('facet', function(facetName, count) {
    ee.emit('facet', facetName, count);
  });
  queryResponse.on('end', function(article) {
    queryDone = true;
    if (facetDone && queryDone) {
      ee.emit('facet', facetName, count);
      ee.emit('end');
    }
  });
  facetResponse.on('count', function(row) {
    var date = row.facet;
    var facet = {facet: date, count: row.count};
    if (dates) {
      if (sort === 'changed') {
        facet.link = site.sitePathToUrl(sitepath) + '$/' + paginationKey +
        '_' + facetKey + '/' + date.getFullYear() + '_' + (date.getMonth() + 1) + '/';
      } else {
        facet.link = site.sitePathToUrl(sitepath) + '$/' + paginationKey +
        '_' + facetKey + '/' + date.getFullYear() + '_' + (date.getMonth() + 1) + '/';
      }
    } else {
      facet.link = site.sitePathToUrl(sitepath) + '$/' + paginationKey +
        '_' + facetKey + '/' + date + '/';
    }
    count.push(facet);
  });
  queryResponse.on('error', function(err) {
    ee.emit('error', err);
  });
  facetResponse.on('end', function(article) {
    facetDone = true;
    if (facetDone && queryDone) {
      ee.emit('facet', count);
      ee.emit('end');
    }
  });
  return ee;
}

/*
 * Dust helper to emit a bunch of objects directly but use Dust.
 */
function emitDirectBlockWithIdx(site, sitepath, scheme, block, pagination, paginationKey, partial, resp, next) {
  var str = '';
  var arts = [];
  var moreLink = '';
  var facets = {};
  resp.on('article', function(article) {
    arts.push(article);
  });
  resp.on('error', function(err) {
    return next(err);
  });
  resp.on('more', function(more) {
    if (more) {
      var tokenPrefix = '';
      if (sitepath.partial) {
        var partialKeyStart = sitepath.partial.indexOf(paginationKey + '_yearmonth');
        if (partialKeyStart !== -1) {
          tokenPrefix = paginationKey + '_yearmonth/' +
            sitepath.partial[partialKeyStart + 1] + '/';
        }
      }
      var token;
      if (block.sort === 'changed') {
        token = [more.date.toISOString(), more.guid];
      } else if (block.sort === 'created') {
        token = [more.pubdate.toISOString(), more.guid];
      } else {
        token = [more.path.toDottedPath().replace(/_/g,'-'), more.guid];
      }
      var pKey = Pagination.generatePageLink(paginationKey,
          pagination, token);
      moreLink = '<a href="' + site.sitePathToUrl(sitepath) +
          '$/' + tokenPrefix + pKey + '">next</a>';
    }
  });
  resp.on('facet', function(facetName, f) {
    facets[facetName] = f;
  });
  resp.on('end', function() {
    scheme.renderSync(partial, {scheme: scheme, site: site, data: arts, moreLink: moreLink, facets: facets}, function(err, out) {
      if (err) {
        return next(err);
      }
      next(null, {format: 'html', source: out, htmlslabs: [out]});
    });
  });
}

function treeHelper(site, tree) {
  var treeLabel = '';
  if (tree.$node) {
    treeLabel = '<a href="' + site.sitePathToUrl(tree.$node.path) + '">' +
      tree.$node.title + "</a>";
  }
  treeLabel = "<li>" + treeLabel + "<ul>";
  for (var key in tree) {
    if (tree.hasOwnProperty(key) && key !== '$node') {
      treeLabel = treeLabel + treeHelper(site, tree[key]);
    }
  }
  return treeLabel + '</ul></li>';
}

/**
 * Install Dust helpers for the Index feed
 * @param {*} dust Dust instance
 * @param {*} db Database instance
 * @param {*} cache Cache instance
 * @param {*} query Query instance
 */
function installDust(dust, db, cache, query) {

  dust.helpers.authorLink = function(chunk, context, bodies, params) {
    var defaultAuthorName = context.get('author');
    var betterAuthorName = context.get('meta.atom:author.name');
    var authorUri = context.get('meta.atom:author.uri');

    if (authorUri) {
      chunk.write('<a href="' + authorUri + '">');
    }
    chunk.write(betterAuthorName || defaultAuthorName);
    if (authorUri) {
      chunk.write('</a>');
    }
  };

  /**
   * Interpolate the title and URL
   *
   * Usage example: `{@titleLink rel="bookmark" /}`
   * rel is the relative link to add
   *
   * @param {*} chunk Dust chunk
   * @param {*} context Dust context
   * @param {*} bodies Child bodies from Dust
   * @param {*} params Params from Dust
   */
  dust.helpers.titleLink = function(chunk, context, bodies, params) {
    var site = context.get('site');
    var path = context.get('link');
    if (!path) {
      path = site.sitePathToUrl(context.get('path'));
    }
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
   * Usage example: `{@titleLink rel="bookmark" /}`
   * rel is the relative link to add
   *
   * @param {*} chunk Dust chunk
   * @param {*} context Dust context
   * @param {*} bodies Child bodies from Dust
   * @param {*} params Params from Dust
   */
  dust.helpers.viaLink = function(chunk, context, bodies, params) {
    var site = context.get('site');
    var path = context.get('link');
    var linkrel = context.resolve(params.rel);
    var vialink;
    if (path) {
      vialink = site.sitePathToUrl(context.get('path'));
    }
    var rel = "";
    if (linkrel) {
      rel = 'rel = "' + linkrel + '" ';
    }
    if (vialink) {
      chunk.write('<a class="via-link"' + rel + 'href="' + vialink + '">(via)</a>');
    } else {
      chunk.write('');
    }

  };

  /**
   * Fetches the most recent change
   *
   * Usage example:
   * `{@mostRecentChange /}`
   *
   * @param {*} chunk Dust chunk
   * @param {*} context Dust context
   * @param {*} bodies Child bodies from Dust
   * @param {*} params Params from Dust
   */

  dust.helpers.mostRecentChange = function(chunk, context, bodies, params) {
    return chunk.map(function(chunk) {
      var ctx = context.get('ctx');
      var path = context.get('path');
      var qr = query.fetchMostRecentChange(db, cache, ctx, path, function(err, modified, revisionId, revisionNum) {
        chunk.write(modified.toISOString());
        chunk.end();
      });
    });
  };

  /**
   * Tree view query
   *
   * Usage example:
   * `{@treeView}`
   * `{/treeView}`
   *
   * rootpath="true" will query based on root, otherwise it will
   * query based on the current path.
   * navbar="true" will filter and only show entities with the navbar tag.
   *
   * @param {*} chunk Dust chunk
   * @param {*} context Dust context
   * @param {*} bodies Child bodies from Dust
   * @param {*} params Params from Dust
   */

  dust.helpers.treeView = function(chunk, context, bodies, params) {
    return chunk.map(function(chunk) {
      var pageCurPath = context.get('path');
      var scheme = context.get('scheme');
      var site = context.get('site');
      var path = pageCurPath;
      var rootPath = context.resolve(params.rootPath);
      var pagination = {};
      if (rootPath) {
        path = site.root;
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
      var hidden = context.resolve(params.hidden);
      if (hidden) {
        filter.hidden = 'only';
      }
      var nullSearch = false;
      var tagPathSearch = context.resolve(params.tagPathSearch);
      if (tagPathSearch) {
        nullSearch = true;
      }
      if (tagPathSearch && pageCurPath.partial) {
        nullSearch = false;
        var mode = validator.stripLow(pageCurPath.partial[0]);
        if (mode === 'tag') {
          if (pageCurPath.partial.length >= 2) {
            filter.predicate = validator.stripLow(pageCurPath.partial[1]);
          }
          if (pageCurPath.partial.length >= 3) {
            filter.tag = validator.stripLow(pageCurPath.partial[2]);
          }
        }
      }
      var textSearch = context.resolve(params.textSearch);
      if (textSearch) {
        nullSearch = false;
        filter.fullText = {string: textSearch};
      }
      var select = 'child';

      if (nullSearch) {
        return chunk.end();
      }
      var protoset = context.get('protoset');
      var security = context.get('security');
      var ctx = context.get('ctx');
      var blobstores = context.get('blobstores');
      var qr = query.query(db, ctx, security, path, select, 'entity', filter,
        undefined, undefined, pagination);
      var resp = addIdx(resultsToIndexFeed(ctx, protoset, scheme, site, blobstores, qr));
      var set = {};
      resp.on('article', function(article) {
        dotty.put(set, article.path.toDottedPath() + '.$node', article);
      });
      resp.on('error', function(err) {
        chunk.end();
      });
      resp.on('end', function() {
        chunk.write('<ul>' + treeHelper(site, dotty.get(set, path.toDottedPath())) + '</ul>');
        chunk.end();
      });
    });
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
   *
   * @param {*} chunk Dust chunk
   * @param {*} context Dust context
   * @param {*} bodies Child bodies from Dust
   * @param {*} params Params from Dust
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
        path = site.root;
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
      var hidden = context.resolve(params.hidden);
      if (hidden) {
        filter.hidden = 'only';
      }
      var nullSearch = false;
      var tagPathSearch = context.resolve(params.tagPathSearch);
      if (tagPathSearch) {
        nullSearch = true;
      }
      if (tagPathSearch && pageCurPath.partial) {
        nullSearch = false;
        var mode = validator.stripLow(pageCurPath.partial[0]);
        if (mode === 'tag') {
          if (pageCurPath.partial.length >= 2) {
            filter.predicate = validator.stripLow(pageCurPath.partial[1]);
          }
          if (pageCurPath.partial.length >= 3) {
            filter.tag = validator.stripLow(pageCurPath.partial[2]);
          }
        }
      }
      var textSearch = context.resolve(params.textSearch);
      if (textSearch) {
        nullSearch = false;
        filter.fullText = {string: textSearch};
      }
      var select = 'dir';
      var selectParam = context.resolve(params.select);
      if (selectParam) {
        select = selectParam;
      }

      if (nullSearch) {
        return chunk.end();
      }

      var sort;
      var sortParam = context.resolve(params.sort);
      if (sortParam) {
        sort = sortParam;
      }
      var limit = context.resolve(params.limit);
      if (limit) {
        pagination.limit = limit;
      }

      var protoset = context.get('protoset');
      var security = context.get('security');
      var ctx = context.get('ctx');
      var blobstores = context.get('blobstores');
      var qr = query.query(db, ctx, security, path, select, 'entity', filter,
        sort, undefined, pagination);
      var resp = addIdx(resultsToIndexFeed(ctx, protoset, scheme, site, blobstores, qr));
      emitEventsWithIdx(chunk, context, bodies, resp);
    });
  };
}

/**
 * Directly render an index.
 * @param {Object} db The database
 * @param {Object} ctx The context
 * @param {Object} sitepath The sitepath for this page
 * @param {Object} access The access object
 * @param {Object} protoset The protoset for this site
 * @param {Object} scheme The scheme in use
 * @param {Object} site The site object
 * @param {Object} query The query object
 * @param {Object} block the textblock
 * @param {string} pos the position of this block for pagination
 * @param {Object} blobstores the blobstore
 * @param {Function} next The next function to call, takes (err, textblock)
 */
function renderDirectIndexFeed(db, ctx, sitepath, access, protoset, scheme, site, query, block, pos, blobstores, next) {
  var path = new SitePath(sitepath);
  if (block.child) {
    path = path.down(block.child);
  }

  var rootPath = block.rootPath;
  if (rootPath) {
    path = site.root;
  }
  var filter = {};
  var navbar = block.navbar;
  if (navbar) {
    filter.navbar = true;
  }

  if (block.proto) {
    filter.protos = [block.proto];
  }

  var paginationKey = pos;
  var paginationLimit;
  if (block.pagination) {
    var perPage = parseInt(block.perPage, 10);
    if (perPage) {
      paginationLimit = perPage;
    } else {
      paginationLimit = 5;
    }
  } else {
    paginationLimit = 100;
  }
  var pagination = Pagination.generatePagination(paginationLimit);

  Pagination.parsePath(pagination, paginationKey,
    sitepath.partial, function(pagination, memento) {
      if (memento.length >= 2) {
        if (block.sort === 'changed') {
          pagination.token = new Date(memento[1]);
          pagination.entityId = memento[2];
        } else if (block.sort === 'created') {
          pagination.token = new Date(memento[1]);
          pagination.entityId = memento[2];
        } else {
          pagination.token = new SitePath(memento[1].replace(/-/g,'_'));
          pagination.entityId = memento[2];
        }
      }
    });

  parseFacetPath(sitepath.partial, paginationKey, filter);

  var partials = {list: true, grid: true, card: true, justified: true, masonry: true};
  var partial = 'partials/card';
  if (block.partial) {
    if (partials.hasOwnProperty(block.partial)) {
      partial = "partials/" + block.partial;
    }
  }

  var monthFacet, tagFacet, predFacet;
  if (block.monthFacet) {
    monthFacet = query.query(db, ctx, access, path, block.query,
      'count', filter, block.sort, {on: 'month'}, {});
  }

  if (block.tagFacet) {
    tagFacet = query.query(db, ctx, access, path, block.query,
      'count', filter, block.sort, {on: 'tag'}, {});
    predFacet = query.query(db, ctx, access, path, block.query,
      'count', filter, block.sort, {on: 'predicate'}, {});
  }

  var qr = query.query(db, ctx, access, path, block.query,
    'entity', filter, block.sort, undefined, pagination);
  var idxFeed = addIdx(resultsToIndexFeed(ctx, protoset, scheme, site, blobstores, qr));
  var resp = Pagination.generateLastLink(idxFeed, pagination);
  if (monthFacet) {
    resp = mergeFacet(resp, monthFacet, 'months', true, 'yearmonth', site, sitepath, block.sort, paginationKey);
  }
  if (tagFacet) {
    resp = mergeFacet(resp, tagFacet, 'tags', false, 'tag', site, sitepath, block.sort, paginationKey);
  }
  if (predFacet) {
    resp = mergeFacet(resp, predFacet, 'predicates', false, 'pred', site, sitepath, block.sort, paginationKey);
  }
  emitDirectBlockWithIdx(site, sitepath, scheme, block, pagination, paginationKey, partial, resp, next);
}

exports.installDust = installDust;
exports.resultsToIndexFeed = resultsToIndexFeed;
exports.renderDirectIndexFeed = renderDirectIndexFeed;
