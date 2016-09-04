var Page = require('../page');
var mixins = require('../mixins');
var view = require('../view');
var util = require("util");
var UserForm = require('../forms/user.js');
var PasswordForm = require('../forms/password.js');
var update = require ('../update'),
    user = require('../authentication/user'),
    authorize = require('../authorize'),
    logging = require('../logging'),
    validator = require('validator'),
    query = require('../query'),
    formlib = require('../formlib');

var boundLogger = logging.getRootLogger('protos.user');

function UserPage() {
  Page.call(this);
  this.proto = 'user';

  this.editTemplate = 'edit-user';
  this.createTemplate = 'edit-user';

  mixins.DeletableMixin(this);
  mixins.BaseBehaviorMixin(this);
  mixins.HistoryViewMixin(this);
  mixins.TagSearchViewMixin(this);

  this.securityRouter.routeAll('password.html', authorize({requiresAuth: true, ownUser: true}));
  this.securityRouter.routeAll('grant.html', authorize({requiresAuth: true, effectivePermission: 'grant'}));
  this.securityRouter.routeAll('drafts.cgi', authorize({requiresAuth: true, effectivePermission: 'viewdraft'}));
  this.securityRouter.routeAll('hidden.cgi', authorize({requiresAuth: true, effectivePermission: 'viewdraft'}));

  this.commandRouter.get('password.html', function(req, res, next) {
    res.expose({}, 'errors');
    next();
  });

  this.commandRouter.post('grant.html', function(req, res, next) {
    update.assignUserToRole(req.db, req.ctx, req.access,
      req.entity.path(), req.body.role, 'grant', function(err) {
        if (err) {
          return next(err);
        }
        return res.redirect(req.site.sitePathToUrl(req.sitepath.down(req.body.path)));
      });
  });

  this.commandRouter.post('password.html', function(req, res, next) {
    var passForm = new PasswordForm(update);
    passForm.checkForm(req.body, function(err) {
      if (err) {
        res.status(400);
        res.serverVars.errors = err;
        res.serverVars.body = req.body;
        res.expose(err, 'errors');

        boundLogger.error('edit.html error', {
          ctx: req.ctx,
          details: err
        });
        return next();
      }

      user.authenticatePassword(req.db, req.ctx, query, req.entity.data.email, req.body.oldpassword, function(err) {
        if (err) {
          return next(err);
        }
        user.updateCredential(req.db, req.ctx, req.entity.data.email, req.sitepath, req.sitepath.leaf(), req.body.password1, function(err) {
          if (err) {
            return next(err);
          } else {
            return res.redirect(req.site.sitePathToUrl(req.sitepath.down(req.body.path)));
          }
        });
      });
    });
  });

  this.exposeFunc = function(editData, req, res, next) {
    editData.username = req.sitepath.leaf();
    formlib.copyViaDottedPath(editData, req.entity, UserForm.formToEntity);
    res.serverVars.bundle = "bundles/user.js";
    res.serverVars.component = "user.jsx";
    res.serverVars.formData = editData;
    next(null, editData);
  };

  this.exposeCreateFunc = function(editData, req, res, next) {
    res.serverVars.bundle = "bundles/user.js";
    res.serverVars.component = "user.jsx";
    next(null, editData);
  };

  this.createFunc = function(now, req, res, next) {
    user.createUser(req.entity, req.sitepath, req.body.username, req.body.fullname, now);
    formlib.copyViaDottedPath(req.entity, req.body, UserForm.entityToForm);
    req.entity.data.disableLogin = validator.toBoolean(req.body.disableLogin);
    res.expose({}, 'errors');

    update.createEntity(req.db, req.ctx, req.access, req.entity, true, 'test', function(err, entityId, revisionId, revisionNum) {
      if (err) {
        return next(err);
      }
      user.createCredential(req.db, req.ctx, req.body.email, req.sitepath, req.body.username, req.body.password1, function(err) {
        if (err) {
          return next(err);
        } else {
          return res.redirect(req.site.sitePathToUrl(req.sitepath.down(req.body.path)));
        }
      });
    });
  };

  this.editFunc = function(oldent, now, req, res, next) {
    req.entity.updateTimes(new Date());
    formlib.copyViaDottedPath(req.entity, req.body, UserForm.entityToForm);
    req.entity.data.disableLogin = validator.toBoolean(req.body.disableLogin);
    res.expose({}, 'errors');
    update.updateEntity(req.db, req.ctx, req.access, oldent, req.entity, true, false, 'test', next);
  };

  this.validateForm = function(update, body, next) {
    var userForm = new UserForm(update);
    userForm.checkForm(body, next);
  };

  this.viewRouter.get('drafts.cgi', function(req, res, next) {
    res.format({
      'text/html': function() {
        view.basicView('drafts', 'drafts', req, res, next);
      }
    });
  });

  this.viewRouter.get('hidden.cgi', function(req, res, next) {
    res.format({
      'text/html': function() {
        view.basicView('hidden', 'hidden', req, res, next);
      }
    });
  });

  this.viewRouter.get('', view.basicViewWithJsonView.bind(this, 'user', 'view-user'));
  this.viewRouter.routeAll('password.html', view.basicView.bind(this, 'password', 'password'));
  this.viewRouter.get('grant.html', view.basicView.bind(this, undefined, 'view-user'));
}

util.inherits(UserPage, Page);

module.exports = UserPage;

