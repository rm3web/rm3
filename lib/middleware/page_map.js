var Protoset = require('../../lib/protoset');

/**
* @overview PageMap will look up the proto of the entity and attach an
* appropriately configured page object to req.page
* @title Page Proto Mapping Middleware
* @module pageMap
*/

/**
  Attach to the express pipeline.  Paramaterized for dependency injection.
  @returns {Function} Connect/Express styled middleware that takes (req, res, next)
*/
function pageMap() {
  return function doPageMap(req, res, next) {
    var proto = req.entity._proto;
    if (!proto) {
      proto = req.query.type;
    }
    req.page = Protoset.getPage(proto);
    next();
  };
}

exports = module.exports = pageMap;
