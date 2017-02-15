var SitePath = require('sitepath');
var async = require('async');

exports = module.exports = function(db, query) {
  var site;

  var keys = ['site', 'sitepath', 'login'];
  async.map(keys, function reqKeys(item, callback) {
    query.getSiteConfig(db, {}, 'default', item, callback);
  }, function(err, res) {
    site = {};
    site.name = res[0].name;
    site.copyright = res[0].copyright;
    site.root = new SitePath(res[1].root);
    site.urlroot = res[1].urlroot;
    site.loginVisible = res[2].visible;
    site.sitePathToUrl = function(sitepath, revisionId) {
      if (revisionId) {
        return sitepath.toUrl('/', 1) + '?revisionId=' + revisionId;
      } else {
        return sitepath.toUrl('/', 1);
      }
    };
  });

  return function addSite(req, res, next) {
    req.site = site;
    return next();
  };
};
