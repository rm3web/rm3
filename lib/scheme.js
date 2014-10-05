var path = require('path');
var dust = require('dustjs-linkedin');
require('dustjs-helpers');
var fs = require('fs');

var Scheme = function () {
	this._themepath = path.join(__dirname, '../scheme/default/');
	this._compileTemplate("index.html","index");
  this._compileTemplate("edit.html","edit");
  this._compileTemplate("base.html","base");
};

Scheme.prototype._compileTemplate = function(templatesrc, templatename) {
	var template = path.join(this._themepath, templatesrc);
	var compiled = dust.compile(fs.readFileSync(template, 'utf8'),templatename);
	dust.loadSource(compiled);
};


Scheme.prototype.render = function (data, view, callback) {
	callback(null, dust.stream(view, data));
};

exports = module.exports = Scheme;
