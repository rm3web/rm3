var Protoset = require('../../lib/protoset');

exports = module.exports = function() {
  return function pageMap(req, res, next) {
    var proto = req.entity._proto;
    if (!proto) {
      proto = req.query.type;
    }
    req.page = Protoset.getPage(proto);
    next();
  };
};