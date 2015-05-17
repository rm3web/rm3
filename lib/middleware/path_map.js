var Sitepath = require('../../lib/sitepath');

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
    } else {
      req.sitepath = new Sitepath();
      req.sitepath.fromUrlSegment(req.path, ['wh']);
    }
    next();
  };
}

exports = module.exports = pathMap;
