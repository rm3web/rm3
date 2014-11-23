var SitePath = require('./sitepath'),
	http = require('http'),
	path = require('path'),
	async = require('async'),
  Router = require('routes'),
  util = require('util'),
  errs = require('errs');

function NoViewFoundError() {
  this.message = "No view found for that URL";
}
util.inherits(NoViewFoundError, Error);
errs.register('page.no_view', NoViewFoundError);

var Page = function () {
	this.view_router = Router();
	this.command_router = Router();
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

Page.prototype._map_command = function(db, req, res, page, callback) {
	var self = this;
	var command = this.command_router.match('/' + req.method + '/' + page);

	if (command !== undefined) {
		command.fn(req, res, self, db, callback);
	} else {
		callback(null);
	}	
};

Page.prototype._map_view = function(req, res, page, callback) {
	var self = this;
	var view = this.view_router.match('/' + req.method + '/' + page);

	if (view === undefined) {
   	return callback(errs.create('page.no_view', {
      method: req.method,
      page: page
    }));
	}
	view.fn(req, res, self, callback);
};

Page.prototype.render = function (db, req, res, next) {
	var self = this, ext, spl, page, 
		method = req.method;
	if (req.sitepath.page) {
		spl = req.sitepath.page.split('.');
		ext = spl[spl.length - 1];
		page = spl.slice(0,-1).join('.');
	}
	if (page === undefined) {
		page = '';
	}

	async.series([
		self._map_command.bind(self, db, req, res, page),
		self._map_view.bind(self, req, res, page)
		],
		function(err, results){
    	if (err) {
    		next(err);
    	}
		}
	);
  
};

module.exports = exports.Page = Page;
