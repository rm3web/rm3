var Sitepath = require('sitepath');
var winston = require('winston');
var logging = require('../logging');
var util = require('util'),
    errs = require('errs'),
    i10n = require('../i10n');

var boundLogger = logging.getRootLogger('middleware.path_map');

/**
* @overview Resolve the URL provided in the req.path to a SitePath and store it
* req.sitepath
* @title Site Path Mapping Middleware
*/

function UnparsablePathError() {
  this.message = "NOT_FOUND";
  this.httpResponseCode = 404;
  Error.call(this);
}
util.inherits(UnparsablePathError, Error);
i10n.intlErrorMixin(UnparsablePathError);
errs.register('path_map.error', UnparsablePathError);

function pathMap() {
  return function doPathMap(req, res, next) {
    var mappath = req.path.match(/^\/\$new(\/.*)/);
    try {
      if (mappath) {
        req.sitepath = Sitepath.fromUrlSegment(mappath[1], ['wh']);
        req.creation = '$new';
        boundLogger.info('map $new', {
          ctx: req.ctx,
          creation: req.creation,
          sitepath: req.sitepath
        });
      } else {
        req.sitepath = Sitepath.fromUrlSegment(req.path, ['wh']);
        boundLogger.info('map', {
          ctx: req.ctx,
          sitepath: req.sitepath
        });
      }
    } catch (e) {
      return logging.logAndCreateError(boundLogger, 'unparsable path',
        'path_map.error', {
          ctx: req.ctx,
          sitepath: req.sitepath
        }, next);
    }
    next();
  };
}

exports = module.exports = pathMap;
