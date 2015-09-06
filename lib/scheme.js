// Load and use polyfill for ECMA-402.
if (!global.Intl) {
  global.Intl = require('intl');
}

var path = require('path');
var dust = require('dustjs-linkedin');
var DustIntl = require('dust-intl');
require('dustjs-helpers');
var reactHelper = require('dust-react-helper');
var fs = require('fs');

DustIntl.registerWith(dust);
reactHelper.install(dust, {extension: '.jsx'});

var Scheme = function(schemepath, db, query) {
  var reactDir = path.join(schemepath, 'partials');
  reactHelper.setReactDir(reactDir);

  this._schemepath = schemepath;
  // Sections
  this._compileTemplate("sections/masthead.html", "sections/masthead");
  this._compileTemplate("sections/navhead.html", "sections/navhead");
  this._compileTemplate("sections/flash.html", "sections/flash");
  this._compileTemplate("sections/navfoot.html", "sections/navfoot");
  this._compileTemplate("sections/navbar.html", "sections/navbar");
  // Base page
  this._compileTemplate("base.html", "base");
  // Layouts
  this._compileTemplate("layouts/full_with_nav.html", "layouts/full_with_nav");
  this._compileTemplate("layouts/full_tiny_sidebar.html", "layouts/full_tiny_sidebar");
  this._compileTemplate("layouts/two_col_with_nav.html", "layouts/two_col_with_nav");
  // Partials
  this._compileTemplate("partials/list.html", "partials/list");
  this._compileTemplate("partials/grant_box.html", "partials/grant_box");
  // Everything else...
  this._compileTemplate("view.html", "view");
  this._compileTemplate("index.html", "index");
  this._compileTemplate("edit.html", "edit");
  this._compileTemplate("base.html", "base");
  this._compileTemplate("create.html", "create");
  this._compileTemplate("history.html", "history");
  this._compileTemplate("login.html", "login");
  this._compileTemplate("view-user.html", "view-user");
  this._compileTemplate("edit-user.html", "edit-user");

  this._compileTemplate("tag.html", "tag");
  this._compileTemplate("error.html", "error");

  var helpers = require(schemepath + 'helpers.js');
  helpers(dust, db, query);
};

Scheme.prototype._compileTemplate = function(templatesrc, templatename) {
  var template = path.join(this._schemepath, templatesrc);
  var compiled = dust.compile(fs.readFileSync(template, 'utf8'), templatename);
  dust.loadSource(compiled);
};

Scheme.prototype.render = function(view, data, callback) {
  callback(null, dust.stream(view, data));
};

Scheme.prototype.renderSync = function(view, data, callback) {
  dust.render(view, data, callback);
};

exports = module.exports = Scheme;
