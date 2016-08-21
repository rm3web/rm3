var textblocks = require('textblocks'),
    IndexFeed = require('./indexfeed'),
    query = require('./query'),
    i10n = require('./i10n'),
    url = require('url'),
    Sitepath = require('sitepath'),
    entity = require('./entity');

textblocks.registerTextBlockType('indexfeed', function(block) {
  /*
  if (block.hasOwnProperty('source')) {
    var output = block.source;
    return {source: output, format: 'custom'};
  }
  throw new Error('html block has neither source nor htmltext');
  */
  return block;
}, function(input, pos, ctx, callback) {
  setTimeout(function() {
    IndexFeed.renderDirectIndexFeed(ctx.db, ctx.ctx, ctx.sitepath, ctx.access,
      ctx.protoset, ctx.scheme, ctx.site, query, input, pos, ctx.blobstores, function(err, text) {
        if (err) {
          return callback(err);
        }
        callback(err, text.source);
      });
  });
});

var svgPlaceholderBox =  '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">\
<rect width="100" height="100" style="fill:rgba(0,0,0);stroke-width:1;stroke:rgb(0,0,0)" />\
</svg>';

textblocks.registerEnhancement('siteImage',function enhanceHtml($, generatePlaceholder) {
  $('img').each(function(i, elem) {
    var srcUrl = $(this).attr('src');
    var placeholder;
    var parsedUrl = url.parse(srcUrl);

    if (!parsedUrl.host) {
      var sitepath = Sitepath.fromUrlSegment(parsedUrl.pathname, ['wh']);
      var attr = $(this).attr('');
      attr.sitepath = sitepath.toDottedPath();
      placeholder = generatePlaceholder($, 'siteImage', attr);
      $(this).replaceWith(placeholder);
    }
  });
}, function(input, ctx, callback) {
  var sitepath = new Sitepath(input.sitepath);
  query.entityFromPath(ctx.db, ctx.cache, entity.Entity, ctx.ctx, ctx.access, sitepath, null, function(err, newentity) {
    if (err) {
      return callback(null, svgPlaceholderBox);
    }
    return ctx.protoset.generateFigure(ctx.ctx, ctx.blobstores, newentity, input, callback);
  });
});

function noCacheView(req, res, next) {
  res.cacheControl.noCache();
  next();
}

function basicView(section, template, req, res, next) {
  var view = req.entity.view();
  view.user = undefined;
  if (req.user) {
    view.user = req.user.user;
  }
  view.security = req.access;
  view.errorMessage = req.getFlashMsgs('error');
  view.infoMessage = req.getFlashMsgs('info');
  view.section = section;
  view.path = req.sitepath;
  view.protoset = req.protoset;
  view.scheme = req.scheme;
  view.blobstores = req.blobstores;
  if (req.user && req.user.user) {
    view.userPath = req.user.user.path();
    res.expose(view.userPath, 'userPath');
    res.expose(req.protoset.listProtos(), 'protos');
    res.expose(req.site.sitePathToUrl(req.sitepath), 'baseurl');
  } else {
    res.expose(undefined, 'userPath');
  }
  if (req.entity.curLogRev) {
    view.curLogRev = req.entity.curLogRev;
    view.isDraft = !req.entity.curLogRev.evtFinal;
    res.expose(view.isDraft, 'isDraft');
    res.expose(view.meta.revisionId, 'revisionId');
  } else {
    res.expose(false, 'isDraft');
    res.expose(false, 'revisionId');
  }
  view.ctx = req.ctx;
  view.intl = i10n.getIntl();
  view.site = req.site;
  res.expose(view.intl, 'intl');
  res.expose(view.section, 'section');
  res.expose(req.entity._proto, 'proto');
  res.expose(view.permissions, 'permissions');
  view.expose = res.locals.state.toString();
  for (var key in res.serverVars) {
    if (res.serverVars.hasOwnProperty(key)) {
      view[key] = res.serverVars[key];
    }
  }
  return req.scheme.render(template, view, req.page._renderPageResponse.bind(this, req, res));
}

function basicViewWithJsonView(section, template, req, res, next) {
  res.format({
    'text/html': function() {
      basicView(section, template, req, res, next);
    },
    'application/json': function() {
      var view = req.entity.view();
      if (view.data.hasOwnProperty('secrets')) {
        view.data.secrets = null;
      }
      res.json(view);
      res.end();
    }
  });
}

exports.basicView = basicView;
exports.noCacheView = noCacheView;
exports.basicViewWithJsonView = basicViewWithJsonView;
