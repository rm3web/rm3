var SitePath = require('./sitepath'),
	http = require('http'),
	path = require('path'),
	async = require('async');

var Page = function () {
	this._template = 'default';
};

Page.prototype._clone = function() {
	var o = Object.create(this);
	return o;
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
	req.scheme.render(req.entity.view(), this._renderPageResponse.bind(this, req, res));
};


module.exports = exports.Page = Page;
