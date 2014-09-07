query = require('../query')

exports = module.exports = function() {
	return function fetch_entity(req, res, next) {
		query.query_db_for_entity(req.sitepath, function(entity){
			req.entity = entity;
			next();
		});
	};
};