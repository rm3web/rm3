var uuid = require('uuid');

exports = module.exports = function() {
  return function addContext(req, res, next) {
    req.ctx = {requestId: uuid.v1()};
    next();
  };
};
