var Page = require('../../lib/page');

exports = module.exports = function() {
  var page = new Page();
	return function path_map(req, res, next) {
		req.page = page;
		next();
	};
};