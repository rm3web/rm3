var Sitepath = require('sitepath');
var winston = require('winston');
var logging = require('../logging');

var boundLogger = logging.getRootLogger('middleware.path_map');

/**
* @overview Resolve the URL provided in the req.path to a SitePath and store it
* req.sitepath
* @title Site Path Mapping Middleware
*/

function pathMap() {
  return function doPathMap(req, res, next) {
    var mappath = req.path.match(/^\/\$new(\/.*)/);
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
    next();
  };
}

exports = module.exports = pathMap;
