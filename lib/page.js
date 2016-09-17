var SitePath = require('sitepath'),
    http = require('http'),
    path = require('path'),
    async = require('async'),
    PageRouter = require('rm3-page-router'),
    util = require('util'),
    errs = require('errs'),
    logging = require('./logging'),
    i10n = require('./i10n'),
    query = require('./query');

var boundLogger = logging.getRootLogger('page');

function NoViewFoundError() {
  this.httpResponseCode = 404;
  this.message = 'NO_VIEW_FOUND_FOR_THAT_URL';
}
util.inherits(NoViewFoundError, Error);
i10n.intlErrorMixin(NoViewFoundError);
errs.register('page.no_view', NoViewFoundError);

function DefaultDenyError() {
  this.httpResponseCode = 403;
  this.message = "THIS_ACTION_IS_NOT_PERMITTED";
}
util.inherits(DefaultDenyError, Error);
i10n.intlErrorMixin(DefaultDenyError);
errs.register('page.default_deny', DefaultDenyError);

var Page = function() {
  this.securityRouter = new PageRouter();
  this.freshnessRouter = new PageRouter();
  this.viewRouter = new PageRouter();
  this.commandRouter = new PageRouter();
};

Page.prototype._renderPageResponse = function(req, res, err, page) {
  if (err) {
    res.write("ERROR");
    boundLogger.error('_renderPageResponse error at start', {
      ctx: req.ctx,
      err: err
    });
    res.end();
    return;
  }
  var responseType = 'text/html';
  if (res.forceResponseType) {
    responseType = res.forceResponseType;
  }
  res.writeHead(200, {'Content-Type': responseType});
  page.on("data", function(data) {
    res.write(data);
  })
  .on("end", function() {
    res.end();
  })
  .on("error", function(err) {
    res.end();
  });
  logging.logEventEmitterErrors(boundLogger, page, req.ctx,
    '_renderPageResponse render error');
};

Page.prototype._mapSecurity = function(req, res, page, callback) {
  var self = this;
  if (self.securityRouter.canHandle(req.method, page)) {
    boundLogger.info('_mapSecurity', {
      ctx: req.ctx,
      method: req.method,
      page: page
    });

    return self.securityRouter.handle(page, req, res, callback);
  } else {
    return logging.logAndCreateError(boundLogger,
      '_mapSecurity has no checks to map',
      'page.default_deny', {
        ctx: req.ctx,
        method: req.method,
        page: page
      }, callback);
  }
};

Page.prototype._mapFreshness = function(req, res, page, callback) {
  var self = this;
  if (self.freshnessRouter.canHandle(req.method, page)) {
    boundLogger.info('_mapFreshness', {
      ctx: req.ctx,
      method: req.method,
      page: page
    });

    return self.freshnessRouter.handle(page, req, res, callback);
  } else {
    query.fetchMostRecentChange(req.db, req.cache, req.ctx, function(err, touched, revisionId, revisionNum) {
      res.cacheControl.userCacheable();
      res.smartEtag(touched, req.entity._revisionId, revisionId);
      if (req.fresh) {
        res.statusCode = 304;
        return res.end();
      }

      callback(err);
    });
  }
};

Page.prototype._mapCommand = function(req, res, page, callback) {
  var self = this;
  if (self.commandRouter.canHandle(req.method, page)) {
    return self.commandRouter.handle(page, req, res, callback);
  } else {
    callback();
  }
};

Page.prototype._mapView = function(req, res, page, callback) {
  var self = this;
  if (self.viewRouter.canHandle(req.method, page)) {
    boundLogger.info('_mapView', {
      ctx: req.ctx,
      method: req.method,
      page: page
    });

    return self.viewRouter.handle(page, req, res, callback);
  } else {
    return logging.logAndCreateError(boundLogger,
      '_mapView has no view to map',
      'page.no_view', {
        ctx: req.ctx,
        method: req.method,
        page: page
      }, callback);
  }
};

Page.prototype.render = function(req, res, next) {
  var self = this, page = req.sitepath.page, method = req.method;
  res.serverVars = {}; // Intentionally not conflicting with express's model

  if (!page) {
    page = '';
  }
  boundLogger.info('render', {
    ctx: req.ctx,
    page: page,
    method: method
  });
  req.page = this;
  async.series(
    [
      self._mapSecurity.bind(self, req, res, page),
      self._mapFreshness.bind(self, req, res, page),
      self._mapCommand.bind(self, req, res, page),
      self._mapView.bind(self, req, res, page)
    ],
  function(err, results) {
    if (err) {
      next(err);
    }
  });
};

module.exports = exports.Page = Page;
