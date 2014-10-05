var path = require('path');

exports = module.exports = function(Scheme) {
	var scheme = new Scheme(path.join(__dirname, '../../scheme/default/'));
	return function path_map(req, res, next) {
		req.scheme = scheme;
		next();
	};
};