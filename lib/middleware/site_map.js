exports = module.exports = function() {
  return function addSite(req, res, next) {
    req.site = {};
    req.site.name = "WireWorld";
    req.site.sitePathToUrl = function(sitepath) {
      return sitepath.toUrl('/', 1);
    };
    next();
  };
};
