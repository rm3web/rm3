var SitePath = require('./sitepath'),
	http = require('http'),
	path = require('path'),
	async = require('async'),
  Router = require('routes');

var Page = function () {
	this.view_router = Router();
	this.command_router = Router();
	this.view_router.addRoute('/', function(req, res, page, next) 
	{
		var view = req.entity.view();
		req.scheme.render(view, 'index', page._renderPageResponse.bind(this, req, res));
	});
	this.view_router.addRoute('/edit', function(req, res, page, next) 
	{
		var view = req.entity.view();
		req.scheme.render(view, 'edit', page._renderPageResponse.bind(this, req, res));
	});
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

Page.prototype.render = function (req, res) {
	var self = this, ext, spl, page, 
		method = req.method;
	if (req.sitepath.page) {
		spl = req.sitepath.page.split('.');
		ext = spl[spl.length - 1];
		page = spl.slice(0,-1).join('.');
	}
	if (page === undefined) {
		page = ''
	}
	var command = this.command_router.match('/' + page);
	if (command != undefined) {
		command.fn(req, res, this, function() {});
	}
	var view = this.view_router.match('/' + page);
  view.fn(req, res, this, function() {});
};


module.exports = exports.Page = Page;
