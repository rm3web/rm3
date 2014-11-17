var Protoset = require('../../lib/protoset');

exports = module.exports = function() {
	return function path_map(req, res, next) {
		req.page = Protoset.get_page(req.entity._proto);
		next();
	};
};