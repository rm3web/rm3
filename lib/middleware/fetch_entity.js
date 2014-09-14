var util = require('util'),
    errs = require('errs');

function NotFoundError() {
  this.message = "Not Found";
  this.code = 404;
}
util.inherits(NotFoundError, Error);
errs.register('fetch_entity.not_found', NotFoundError);

exports = module.exports = function(db, query, entity) {
	return function fetch_entity(req, res, next) {
		query.entity_from_path(db, entity, req.sitepath, null, function(err, entity){
      if (err) {
        if (err.hasOwnProperty('name')) {
          if (err.name == "EntityNotFoundError") {
            return next(errs.create('fetch_entity.not_found', {path: req.path}));
          }
        }
        return next(err);
      }
			req.entity = entity;
			next();
		});
	};
};