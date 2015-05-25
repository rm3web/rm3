exports = module.exports = function() {
  return function addSite(req, res, next) {
    req.site = {};
    req.site.name = "WireWorld";
    next();
  };
};
