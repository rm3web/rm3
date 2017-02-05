// Load and use polyfill for ECMA-402.
if (!global.Intl) {
  global.Intl = require('intl');
}

var path = require('path');
var dust = require('dustjs-linkedin');
var DustIntl = require('dust-intl');
require('dustjs-helpers');
var fs = require('fs');
var ActivityFeed = require('./activityfeed');
var IndexFeed = require('./indexfeed');
var TagHelpers = require('./taghelpers');
var TextblockHelpers = require('./textblockhelpers');
var SiteHelpers = require('./sitehelpers');
var SchemeHelpers = require('./schemehelpers');
var AuthorizeHelpers = require('./authorizehelpers');
var ReactHelpers = require('./reacthelpers');

DustIntl.registerWith(dust);

var Scheme = function(schemepaths, db, cache, query) {
  this._schemepaths = schemepaths;
  // Sections
  this._compileTemplate("sections/masthead.html", "sections/masthead");
  this._compileTemplate("sections/navhead.html", "sections/navhead");
  this._compileTemplate("sections/flash.html", "sections/flash");
  this._compileTemplate("sections/navfoot.html", "sections/navfoot");
  this._compileTemplate("sections/navbar.html", "sections/navbar");
  this._compileTemplate("sections/userbar.html", "sections/userbar");
  // Base page
  this._compileTemplate("base.html", "base");
  // Layouts
  this._compileTemplate("layouts/full_with_nav.html", "layouts/full_with_nav");
  this._compileTemplate("layouts/full_tiny_sidebar.html", "layouts/full_tiny_sidebar");
  this._compileTemplate("layouts/two_col_with_nav.html", "layouts/two_col_with_nav");
  this._compileTemplate("layouts/full_sidebar_nav.html", "layouts/full_sidebar_nav");
  // Partials
  this._compileTemplate("partials/list.html", "partials/list");
  this._compileTemplate("partials/card.html", "partials/card");
  this._compileTemplate("partials/grid.html", "partials/grid");
  this._compileTemplate("partials/justified.html", "partials/justified");
  this._compileTemplate("partials/masonry.html", "partials/masonry");
  this._compileTemplate("partials/grant_box.html", "partials/grant_box");
  // Everything else...
  this._compileTemplate("atom.xml", "atom");
  this._compileTemplate("view.html", "view");
  this._compileTemplate("index.html", "index");
  this._compileTemplate("edit.html", "edit");
  this._compileTemplate("base.html", "base");
  this._compileTemplate("create.html", "create");
  this._compileTemplate("history.html", "history");
  this._compileTemplate("hidden.html", "hidden");
  this._compileTemplate("moderate.html", "moderate");
  this._compileTemplate("login.html", "login");
  this._compileTemplate("view-user.html", "view-user");
  this._compileTemplate("view-comment.html", "view-comment");
  this._compileTemplate("view-blog.html", "view-blog");
  this._compileTemplate("view-blog-sidebar.html", "view-blog-sidebar");
  this._compileTemplate("view-blogindex.html", "view-blogindex");
  this._compileTemplate("view-imageindex.html", "view-imageindex");
  this._compileTemplate("view-predicate.html", "view-predicate");
  this._compileTemplate("view-ontag.html", "view-ontag");
  this._compileTemplate("view-link.html", "view-link");
  this._compileTemplate("edit-user.html", "edit-user");
  this._compileTemplate("tag.html", "tag");
  this._compileTemplate("search.html", "search");
  this._compileTemplate("drafts.html", "drafts");
  this._compileTemplate("vectorgraphic.html", "vectorgraphic");
  this._compileTemplate("photo.html", "photo");
  this._compileTemplate("audio.html", "audio");
  this._compileTemplate("password.html", "password");
  this._compileTemplate("totp.html", "totp");
  this._compileTemplate("totp-setup.html", "totp-setup");
  this._compileTemplate("send-email.html", "send-email");
  this._compileTemplate("tree.html", "tree");

  this._compileTemplate("error.html", "error");
  this._compileTemplate("403.html", "403");
  this._compileTemplate("404.html", "404");
  this._compileTemplate("410.html", "410");
  this._compileTemplate("429.html", "429");

  var reactDirs = schemepaths.map(function(schemeDir) {
    return path.join(schemeDir, 'partials');
  });

  schemepaths.forEach(function(schemeDir) {
    if (fs.existsSync(path.join(schemeDir, 'helpers.js'))) {
      var helpers = require(path.join(schemeDir, 'helpers.js'));
      helpers(dust, db, cache, query, reactDirs);
    }
  });

  ActivityFeed.installDust(dust, db, query);
  IndexFeed.installDust(dust, db, cache, query);
  TagHelpers.installDust(dust, db, query);
  TextblockHelpers.installDust(dust, db, query);
  SiteHelpers.installDust(dust, db, query);
  SchemeHelpers.installDust(dust, db, query);
  ReactHelpers.installDust(dust, db, query, reactDirs);
  AuthorizeHelpers.installDust(dust, db, query);
};

Scheme.prototype.getSchemePath = function(filepath) {
  var template;
  for (var i = this._schemepaths.length - 1; (i >= 0 && template === undefined); --i) {
    if (fs.existsSync(path.join(this._schemepaths[i], filepath))) {
      template = path.join(this._schemepaths[i], filepath);
    }
  }
  return template;
};

Scheme.prototype.getResourcePath = function(path) {
  return '/resources/' + path;
};

Scheme.prototype._compileTemplate = function(templatesrc, templatename) {
  var template = this.getSchemePath(templatesrc);
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
