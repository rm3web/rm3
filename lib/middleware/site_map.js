var Scheme = require('../../lib/scheme');

exports = module.exports = function() {
	return function add_site(req, res, next) {
		next();
	};
};