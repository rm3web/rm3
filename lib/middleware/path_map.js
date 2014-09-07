var Sitepath = require('../../lib/sitepath');

exports = module.exports = function() {
	return function path_map(req, res, next) {
		req.sitepath = new Sitepath();
		req.sitepath.fromUrlSegment(req.path, ['wh']);
		next();
	};
};