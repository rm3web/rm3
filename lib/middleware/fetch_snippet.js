var Scheme = require('../../lib/scheme')

exports = module.exports = function() {
	return function fetch_snippet(req, res, next) {
		next();
	};
};