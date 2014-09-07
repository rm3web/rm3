exports = module.exports = function(query) {
	return function fetch_entity(req, res, next) {
		query.entity_from_path(req.sitepath, null, function(err, entity){
			req.entity = entity;
			next();
		});
	};
};