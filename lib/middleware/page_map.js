var Page = require('../../lib/page')

exports = module.exports = function() {
	return function path_map(req, res, next) {
		req.page = new Page()
		next();
	};
};