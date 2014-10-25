var util = require('util'),
    errs = require('errs'),
    validator = require('validator');

function NotFoundError() {
  this.message = "Not Found";
  this.http_response_code = 404;
}
util.inherits(NotFoundError, Error);
errs.register('fetch_entity.not_found', NotFoundError);

exports = module.exports = function(db, query, entity) {
	return function fetch_entity(req, res, next) {
    if (req.creation) {
      req.entity = new entity();
      return next();
    } else {
      var revid = null;
      if (req.hasOwnProperty('query') && req.query.hasOwnProperty('revision_id')) {
        if (validator.isUUID(req.query.revision_id)) {
          revid = req.query.revision_id;
        }
      }
  		query.entity_from_path(db, entity, req.sitepath, revid, function(err, newentity){
        if (err) {
          if (err.hasOwnProperty('name')) {
            if (err.name == "EntityNotFoundError") {
              return next(errs.create('fetch_entity.not_found', {path: req.path}));
            }
          }
          return next(err);
        }
  			req.entity = newentity;
  			return next();
  		});
    }
	};
};