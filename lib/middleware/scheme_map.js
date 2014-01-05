var Scheme = require('../../lib/scheme')

exports = module.exports = function() {
	var scheme = new Scheme();
	return function path_map(req, res, next) {
		req.scheme = scheme;
		next();
	};
};