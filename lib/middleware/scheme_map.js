var path = require('path');

exports = module.exports = function(scheme) {
  return function schemeMap(req, res, next) {
    req.scheme = scheme;
    next();
  };
};
