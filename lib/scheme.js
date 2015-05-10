// Load and use polyfill for ECMA-402.
if (!global.Intl) {
    global.Intl = require('intl');
}


var path = require('path');
var dust = require('dustjs-linkedin');
var DustIntl = require('dust-intl');
require('dustjs-helpers');
var fs = require('fs');

DustIntl.registerWith(dust);


var Scheme = function (schemepath, db, query) {
	this._schemepath = schemepath;
	this._compileTemplate("view.html","view");
  this._compileTemplate("index.html","index");
  this._compileTemplate("edit.html","edit");
  this._compileTemplate("base.html","base");
  this._compileTemplate("create.html","create");
  this._compileTemplate("message.html","message");
  this._compileTemplate("history.html","history");
  this._compileTemplate("login.html","login");
  this._compileTemplate("view-user.html","view-user");
  this._compileTemplate("edit-user.html","edit-user");
  this._compileTemplate("flash.html","flash");
  this._compileTemplate("tag.html","tag");
  var helpers = require(schemepath + 'helpers.js');
  helpers(dust, db, query);
};

Scheme.prototype._compileTemplate = function(templatesrc, templatename) {
	var template = path.join(this._schemepath, templatesrc);
	var compiled = dust.compile(fs.readFileSync(template, 'utf8'),templatename);
	dust.loadSource(compiled);
};


Scheme.prototype.render = function (view, data, callback) {
	callback(null, dust.stream(view, data));
};

exports = module.exports = Scheme;
