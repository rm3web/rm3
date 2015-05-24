exports = module.exports = function() {
  return function addSite(req, res, next) {
    next();
  };
};
