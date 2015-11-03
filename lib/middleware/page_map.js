var Protoset = require('../../lib/protoset');
var logging = require('../logging');
var util = require('util');
var errs = require('errs');

var boundLogger = logging.getRootLogger('middleware.page_map');

function BadProto() {
  this.httpResponseCode = 500;
  this.message = "Bad proto retrieved from database";
}
util.inherits(BadProto, Error);
errs.register('page_map.bad_proto', BadProto);

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
      boundLogger.info('map from query', {
        ctx: req.ctx,
        proto: req.query.type
      });
      proto = req.query.type;
    } else {
      boundLogger.info('map', {
        ctx: req.ctx,
        proto: proto
      });
    }
    req.protoset = Protoset;
    req.page = Protoset.getPage(proto);
    if (!req.page) {
      return logging.logAndCreateError(boundLogger, 'bad proto',
                'page_map.bad_proto', {
                ctx: req.ctx,
                proto: proto,
                sitepath: req.sitepath,
              }, next);
    }
    next();
  };
}

exports = module.exports = pageMap;
