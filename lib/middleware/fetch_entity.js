exports = module.exports = function(db, query, entity) {
	return function fetch_entity(req, res, next) {
		query.entity_from_path(db, entity, req.sitepath, null, function(err, entity){
			req.entity = entity;
			next();
		});
	};
};