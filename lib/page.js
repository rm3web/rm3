var SitePath = require('./sitepath'),
	http = require('http'),
	path = require('path'),
	async = require('async'),
  Router = require('routes'),
  update = require ('./update');  

var Page = function () {
	this.view_router = Router();
	this.command_router = Router();
	this.view_router.addRoute('/', function(req, res, page, next) 
	{
		var view = req.entity.view();
		req.scheme.render(view, 'index', page._renderPageResponse.bind(this, req, res));
	});
	this.command_router.addRoute('/edit', function(req, res, page, db, next)
	{
		if (req.method === 'POST') {
			oldent = req.entity.clone();
			req.entity.data.posting = req.body.posting;
			update.update_entity(db, oldent, req.entity, true, 'test', next);
		} else {
			next();
		}
	});
	this.command_router.addRoute('/create', function(req, res, page, db, next)
	{
		if (req.method === 'POST') {
			req.entity.createNew(req.sitepath.down(req.body.path), 'base');
			req.entity.data.posting = req.body.posting;
			req.entity.summary.title = req.body.title;
			req.entity.summary.abstract = req.body.abstract;
			update.create_entity(db, req.entity, true, 'test', 
			function(err, entity_id, revision_id, revision_num) {
				if (err) {
					return next(err);
				} else {
					return res.redirect(req.sitepath.down(req.body.path).toUrl('/',1));
				}
			});
		} else {
			req.entity.createNew(req.sitepath.down(req.body.path), 'base');
			next();
		}
	});
	this.view_router.addRoute('/edit', function(req, res, page, next) 
	{
		var view = req.entity.view();
		view.section = 'edit';
		req.scheme.render(view, 'edit', page._renderPageResponse.bind(this, req, res));
	});
	this.view_router.addRoute('/create', function(req, res, page, next) 
	{
		var view = req.entity.view();
		view.section = 'create';
		view.path = req.sitepath.toDottedPath();
		req.scheme.render(view, 'create', page._renderPageResponse.bind(this, req, res));
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

Page.prototype.render = function (db, req, res) {
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

	var command = this.command_router.match('/' + page);
	
	var view = this.view_router.match('/' + page);
	async.series([
		function(callback) {
			if (command !== undefined) {
				command.fn(req, res, self, db, callback);
			} else {
				callback(null);
			}
		},
		function(callback) {
			view.fn(req, res, self, callback);
		}]
	);
  
};


module.exports = exports.Page = Page;
