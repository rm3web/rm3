var util = require('util'),
    errs = require('errs'),
    validator = require('validator');

/**
* @overview Fetch entity will fetch the entity from the database based on the already
*  stored path, look for a `revisionId` paramater, and attach it to the request
* @title Entity Fetching Middleware
* @module fetchEntity
*/

function NotFoundError() {
  this.message = "Not Found";
  this.httpResponseCode = 404;
}
util.inherits(NotFoundError, Error);
errs.register('fetch_entity.not_found', NotFoundError);

/**
  Attach to the express pipeline.  Paramaterized for dependency injection.
  @param {Object} db DB wrapper
  @param {Object} query Query object
  @param {Object} Entity Entity class
  @returns {Function} Connect/Express styled middleware that takes (req, res, next)
*/
function fetchEntity (db, query, Entity) {
  return function doFetchEntity(req, res, next) {
    if (req.creation) {
      req.entity = new Entity();
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
      query.entityFromPath(db, Entity, security, req.sitepath, revid, function(err, newentity) {
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
}

exports = module.exports = fetchEntity;
