var Sitepath = require('../../lib/sitepath');
var winston = require('winston');
var WinstonContext = require('winston-context');

var boundLogger = new WinstonContext(winston, '', {
  system: 'middleware.path_map'
});

/**
* @overview Resolve the URL provided in the req.path to a SitePath and store it
* req.sitepath
* @title Site Path Mapping Middleware
*/

function pathMap() {
  return function doPathMap(req, res, next) {
    var mappath = req.path.match(/^\/\$new(\/.*)/);
    if (mappath) {
      req.sitepath = new Sitepath();
      req.sitepath.fromUrlSegment(mappath[1], ['wh']);
      req.creation = '$new';
      boundLogger.info('map $new',{
        ctx: req.ctx,
        creation: req.creation,
        sitepath: req.sitepath
      });
    } else {
      req.sitepath = new Sitepath();
      req.sitepath.fromUrlSegment(req.path, ['wh']);
      boundLogger.info('map',{
        ctx: req.ctx,
        sitepath: req.sitepath
      });
    }
    next();
  };
}

exports = module.exports = pathMap;
