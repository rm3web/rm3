var path = require('path');
var dust = require('dustjs-linkedin');
var fs = require('fs');

var Scheme = function () {
	this._themepath = path.join(__dirname, '../scheme/default/');
	this._compileTemplate("index.html","index");
  this._compileTemplate("base.html","base");
};

Scheme.prototype._compileTemplate = function(templatesrc, templatename) {
	var template = path.join(this._themepath, templatesrc);
	var compiled = dust.compile(fs.readFileSync(template, 'utf8'),templatename);
	dust.loadSource(compiled);
};


Scheme.prototype.render = function (data, callback) {
	callback(null, dust.stream('index', data));
};

exports = module.exports = Scheme;
