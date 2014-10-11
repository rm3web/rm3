var Sitepath = require('../../lib/sitepath');

exports = module.exports = function() {
	return function path_map(req, res, next) {
    mappath = req.path.match(/^\/\$new(\/.*)/);
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
};