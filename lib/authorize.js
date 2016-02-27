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
errs.register('page.not_allowed', NotAllowedError);

function authorize(options) {
  return function auth(req, res, next) {
    var user;
    if (req.user) {
      user = req.user.user;
    }
    var permissions = req.entity.permissions;

    if (options.requiresAuth &&
        !user) {
      return logging.logAndCreateError(boundLogger, 'authorize not allowed',
        'page.not_allowed', {
        ctx: req.ctx,
        reason: "Only allowed for logged in users"
      }, next);
    }

    if (options.permission &&
      !permissions.hasOwnProperty(options.permission)) {
      return logging.logAndCreateError(boundLogger, 'authorize no permission',
        'page.not_allowed', {
        ctx: req.ctx,
        reason: "Your user does not have the required permission"
      }, next);
    }

    if (options.effectivePermission) {
      var userpath;
      if (user) {
        userpath = user.path();
      }
      query.fetchEffectivePermissions(req.db, req.ctx, userpath, req.sitepath, function(err, effPerm) {
        if (err) {
          next(err);
        }
        if (!effPerm.hasOwnProperty(options.effectivePermission)) {
          return logging.logAndCreateError(boundLogger,
            'authorize no effective permission',
            'page.not_allowed', {
            ctx: req.ctx,
            reason: "Your user does not have the required permission"
          }, next);
        }
      });
    }
    next();
  };
}

exports = module.exports = authorize;
