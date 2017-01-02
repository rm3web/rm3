var util = require("util");
var logging = require('./logging'),
    errs = require('errs'),
    i10n = require('./i10n'),
    query = require('./query');

var boundLogger = logging.getRootLogger('authorize');

function NotAllowedError() {
  this.httpResponseCode = 403;
  this.message = "THIS_ACTION_IS_NOT_PERMITTED";
  Error.call(this);
}
util.inherits(NotAllowedError, Error);
i10n.intlErrorMixin(NotAllowedError);
errs.register('authorize.not_allowed', NotAllowedError);

function authorize(options) {
  return function auth(req, res, next) {
    var user, userpath;
    if (req.user) {
      user = req.user.user;
    }
    var permissions = req.entity.permissions;

    if (options.requiresAuth &&
        !user) {
      return logging.logAndCreateError(boundLogger, 'authorize not allowed',
        'authorize.not_allowed', {
          ctx: req.ctx,
          reason: "Only allowed for logged in users"
        }, next);
    }

    if (options.permission) {
      var permission = options.permission;
      if (permission === 'edit' || permission === 'delete') {
        permission = 'post.' + permission;
      }
      if (!permissions.hasOwnProperty(permission)) {
        return logging.logAndCreateError(boundLogger, 'authorize no permission',
          'authorize.not_allowed', {
            ctx: req.ctx,
            permission: permission,
            reason: "Your user does not have the required permission"
          }, next);
      }
    }

    if (options.ownUser) {
      if (user) {
        userpath = user.path();

        if (req.sitepath.toDottedPath() !== userpath.toDottedPath()) {
          return logging.logAndCreateError(boundLogger, 'authorize no permission',
            'authorize.not_allowed', {
              ctx: req.ctx,
              ownUser: userpath,
              reason: "Your user does not have the required permission"
            }, next);
        }
      } else {
        return logging.logAndCreateError(boundLogger, 'authorize no permission',
            'authorize.not_allowed', {
              ctx: req.ctx,
              reason: "Your user does not have the required permission"
            }, next);
      }
    }

    if (options.effectivePermission) {
      var effectivePermission = options.effectivePermission;
      if (effectivePermission === 'edit' || effectivePermission === 'delete') {
        effectivePermission = 'post.' + effectivePermission;
      }
      if (user) {
        userpath = user.path();
      }
      return query.fetchEffectivePermissions(req.db, req.cache, req.ctx, userpath, req.sitepath, function(err, effPerm) {
        if (err) {
          return next(err);
        }
        if (!effPerm.hasOwnProperty(effectivePermission)) {
          return logging.logAndCreateError(boundLogger,
            'authorize no effective permission',
            'authorize.not_allowed', {
              ctx: req.ctx,
              effectivePermission: effectivePermission,
              reason: "Your user does not have the required permission"
            }, next);
        }
        return next();
      });
    }
    return next();
  };
}

function authorizeAnd(branch1, branch2) {
  return function authAnd(req, res, next) {
    branch1(req, res, function(err) {
      if (err) {
        return next(err);
      }
      branch2(req, res, function(err) {
        if (err) {
          return next(err);
        }
        return next();
      });
    });
  };
}

function authorizeOr(branch1, branch2) {
  return function authOr(req, res, next) {
    branch1(req, res, function(err) {
      if (!err) {
        return next();
      }
      branch2(req, res, function(err) {
        if (!err) {
          return next();
        }
        return next(err);
      });
    });
  };
}

exports = module.exports = authorize;
authorize.authorizeAnd = authorizeAnd;
authorize.authorizeOr = authorizeOr;
