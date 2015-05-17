var SitePath = require('./sitepath'),
	http = require('http'),
	path = require('path'),
	async = require('async'),
  PageRouter = require('page-router'),
  util = require('util'),
  errs = require('errs');

function NoViewFoundError() {
  this.message = "No view found for that URL";
}
util.inherits(NoViewFoundError, Error);
errs.register('page.no_view', NoViewFoundError);

var Page = function() {
  this.viewRouter = new PageRouter();
  this.commandRouter = new PageRouter();
};

Page.prototype._renderPageResponse = function(req, res, err, page) {
  if (err) {
    res.write("ERROR");
    console.log(err);
    res.end();
    return;
  }
  res.writeHead(200, {'Content-Type': 'text/html'});
  page.on("data", function(data) {
    res.write(data);
  })
	.on("end", function() {
  res.end();
	})
	.on("error", function(err) {
  res.end();
  console.log("RENDERNG ERROR");
  console.log(err);
	});
};

Page.prototype._mapCommand = function(req, res, page, callback) {
  var self = this;
  req.page = self;
  return self.commandRouter.handle(page, req, res, callback);
};

Page.prototype._mapView = function(req, res, page, callback) {
  var self = this;
  if (self.viewRouter.canHandle(req.method, page)) {
    req.page = self;
    return self.viewRouter.handle(page, req, res, callback);
  } else {
    return callback(errs.create('page.no_view', {
      method: req.method,
      page: page
    }));
  }
};

Page.prototype.render = function(req, res, next) {
  var self = this, page = req.sitepath.page,
  method = req.method;

  if (!page) {
    page = '';
  }

  async.series(
    [
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
