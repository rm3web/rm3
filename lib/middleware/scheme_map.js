var path = require('path');

exports = module.exports = function(Scheme, db, query) {
  var scheme = new Scheme(path.join(__dirname, '../../scheme/default/'), db, query);
  return function schemeMap(req, res, next) {
    req.scheme = scheme;
    next();
  };
};
