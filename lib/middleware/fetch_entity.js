var util = require('util'),
    errs = require('errs'),
    validator = require('validator');

function NotFoundError() {
  this.message = "Not Found";
  this.httpResponseCode = 404;
}
util.inherits(NotFoundError, Error);
errs.register('fetch_entity.not_found', NotFoundError);

exports = module.exports = function(db, query, entity) {
  return function fetchEntity(req, res, next) {
    if (req.creation) {
      req.entity = new entity();
      return next();
    } else {
      var revid = null;
      if (req.hasOwnProperty('query') && req.query.hasOwnProperty('revisionId')) {
        if (validator.isUUID(req.query.revisionId)) {
          revid = req.query.revisionId;
        }
      }
      var security = {context: 'STANDARD'};
      if (req.hasOwnProperty('user')) {
        security.user = req.user.path();
      }
      query.entityFromPath(db, entity, security, req.sitepath, revid, function(err, newentity){
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