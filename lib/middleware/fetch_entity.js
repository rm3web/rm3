var util = require('util'),
    errs = require('errs'),
    validator = require('validator'),
    logging = require('../logging'),
    SitePath = require('sitepath'),
    i10n = require('../i10n');

var boundLogger = logging.getRootLogger('middleware.fetch_entity');

/**
* @overview Fetch entity will fetch the entity from the database based on the already
*  stored path, look for a `revisionId` paramater, and attach it to the request
* @title Entity Fetching Middleware
* @module fetchEntity
*/

function GoneError() {
  this.message = "GONE";
  this.httpResponseCode = 410;
  Error.call(this);
}
util.inherits(GoneError, Error);
i10n.intlErrorMixin(GoneError);
errs.register('fetch_entity.gone', GoneError);

function RevisionNotFoundError() {
  this.message = "NOT_FOUND";
  this.httpResponseCode = 400;
  Error.call(this);
}
util.inherits(RevisionNotFoundError, Error);
i10n.intlErrorMixin(RevisionNotFoundError);
errs.register('fetch_entity.revision_not_found', RevisionNotFoundError);

function PathNotFoundError() {
  this.message = "NOT_FOUND";
  this.httpResponseCode = 404;
  Error.call(this);
}
util.inherits(PathNotFoundError, Error);
i10n.intlErrorMixin(PathNotFoundError);
errs.register('fetch_entity.not_found', PathNotFoundError);

function ForbiddenError() {
  this.message = "FORBIDDEN";
  this.httpResponseCode = 403;
  Error.call(this);
}
util.inherits(ForbiddenError, Error);
i10n.intlErrorMixin(ForbiddenError);
errs.register('fetch_entity.forbidden', ForbiddenError);

/**
  Attach to the express pipeline.  Paramaterized for dependency injection.
  @param {Object} db DB wrapper
  @param {Object} cache Cache wrapper
  @param {Object} query Query object
  @param {Object} Entity Entity class
  @param {Object} StubEntity StubEntity class
  @return {Function} Connect/Express styled middleware that takes (req, res, next)
*/
function fetchEntity(db, cache, query, Entity, StubEntity) {
  return function doFetchEntity(req, res, next) {
    req.Entity = Entity;
    if (req.creation) {
      boundLogger.info('fetch new', {
        ctx: req.ctx
      });
      req.entity = new Entity();
      return next();
    } else {
      var revid = null;
      if (req.hasOwnProperty('query') && req.query.hasOwnProperty('revisionId')) {
        if (validator.isUUID(req.query.revisionId)) {
          revid = req.query.revisionId;
        }
      }
      if (req.hasOwnProperty('body') && req.body.hasOwnProperty('revisionId')) {
        if (validator.isUUID(req.body.revisionId)) {
          revid = req.body.revisionId;
        }
      }
      var security = req.access;
      boundLogger.info('fetch', {
        ctx: req.ctx,
        security: security,
        sitepath: req.sitepath,
        revid: revid
      });
      query.entityFromPath(db, cache, Entity, req.ctx, security, req.sitepath, revid, function(err, newentity) {
        if (err) {
          if (err.hasOwnProperty('name')) {
            if (err.name == "EntityNotFoundError") {
              return logging.logAndCreateError(boundLogger, 'fetch not found',
                'fetch_entity.not_found', {
                  ctx: req.ctx,
                  security: security,
                  sitepath: req.sitepath,
                  revId: revid
                }, next);
            }
            if (err.name == "PermissionsNotFoundError") {
              return logging.logAndCreateError(boundLogger, 'forbidden',
                'fetch_entity.forbidden', {
                  ctx: req.ctx,
                  security: security,
                  sitepath: req.sitepath,
                  revId: revid
                }, next);
            }
            if (err.name == "RevisionIdNotFoundError") {
              return logging.logAndCreateError(boundLogger, 'fetch rev not found',
                'fetch_entity.revision_not_found', {
                  ctx: req.ctx,
                  security: security,
                  sitepath: req.sitepath,
                  revId: revid
                }, next);
            }
          }
          return next(err);
        }
        if (newentity instanceof StubEntity) {
          if (newentity.summary && newentity.summary.moved) {
            var newPath = new SitePath(newentity.summary.path);
            return res.redirect(308, req.site.sitePathToUrl(newPath));
          }
          if (newentity.summary && newentity.summary.deleted && newentity.summary.redirect) {
            return res.redirect(308, newentity.summary.redirect);
          }
          return logging.logAndCreateError(boundLogger, 'fetch gone',
            'fetch_entity.gone', {
              ctx: req.ctx,
              security: security,
              sitepath: req.sitepath,
              revId: revid
            }, next);
        }
        if (newentity.curLogRev && !newentity.curLogRev.evtFinal) {
          if (!newentity.permissions.hasOwnProperty('viewdraft')) {
            return logging.logAndCreateError(boundLogger, 'forbidden',
              'fetch_entity.forbidden', {
                ctx: req.ctx,
                security: security,
                sitepath: req.sitepath,
                revId: revid
              }, next);
          }
        }
        req.entity = newentity;
        return next();
      });
    }
  };
}

exports = module.exports = fetchEntity;
