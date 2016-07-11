var textblocks = require('textblocks'),
    IndexFeed = require('./indexfeed'),
    query = require('./query'),
    i10n = require('./i10n');

function doPragmaBlocks(req, view, block, pos, next) {
  return IndexFeed.renderDirectIndexFeed(req.db, req.ctx, req.sitepath, req.access, req.protoset, req.scheme, req.site, query, view, block, pos, next);
}

function basicView(section, template, resolve, req, res, next) {
  var view = req.entity.view();
  view.user = undefined;
  if (req.user) {
    view.user = req.user.user;
  }
  view.security = req.access;
  view.errorMessage = req.flash('error');
  view.infoMessage = req.flash('info');
  view.section = section;
  view.path = req.sitepath;
  view.protoset = req.protoset;
  view.scheme = req.scheme;
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
  }
  view.ctx = req.ctx;
  view.intl = i10n.getIntl();
  view.site = req.site;
  view.resolve = resolve;
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
  if (resolve) {
    textblocks.resolvePragmaBlocks(view.data[resolve], resolve, doPragmaBlocks.bind(this, req, view), function(err, block) {
      if (err) {
        return next(err);
      }
      view.data[resolve] = block;
      return req.scheme.render(template, view, req.page._renderPageResponse.bind(this, req, res));
    });
  } else {
    return req.scheme.render(template, view, req.page._renderPageResponse.bind(this, req, res));
  }
}

function basicViewWithJsonView(section, template, resolve, req, res, next) {
  res.format({
    'application/json': function() {
      var view = req.entity.view();
      if (view.data.hasOwnProperty('secrets')) {
        view.data.secrets = null;
      }
      if (resolve) {
        textblocks.resolvePragmaBlocks(view.data[resolve], resolve, doPragmaBlocks.bind(this, req, view), function(err, block) {
          if (err) {
            return next(err);
          }
          view.data[resolve] = block;
          res.json(view);
          res.end();
        });
      } else {
        res.json(view);
        res.end();
      }
    },
    'text/html': function() {
      basicView(section, template, resolve, req, res, next);
    }
  });
}

exports.basicView = basicView;
exports.basicViewWithJsonView = basicViewWithJsonView;
exports.doPragmaBlocks = doPragmaBlocks;
