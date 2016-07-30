var Page = require('../page');
var mixins = require('../mixins');
var view = require('../view');
var util = require("util");
var UserForm = require('../forms/user.js');
var PasswordForm = require('../forms/password.js');
var update = require ('../update'),
    user = require('../user'),
    authorize = require('../authorize'),
    logging = require('../logging'),
    validator = require('validator'),
    query = require('../query');

var boundLogger = logging.getRootLogger('protos.user');

function mutateKey(formval, obj, key) {
  if (!validator.isNull(formval)) {
    obj[key] = formval;
  } else {
    if (obj.hasOwnProperty(key)) {
      delete obj[key];
    }
  }
}

function UserPage() {
  Page.call(this);
  this.proto = 'user';

  this.editTemplate = 'edit-user';
  this.createTemplate = 'edit-user';

  mixins.DeletableMixin(this);
  mixins.BaseBehaviorMixin(this);
  mixins.HistoryViewMixin(this);
  mixins.TagSearchViewMixin(this);

  this.commandRouter.routeAll('password.html', authorize({requiresAuth: true, ownUser: true}));
  this.commandRouter.routeAll('grant.html', authorize({requiresAuth: true, effectivePermission: 'grant'}));
  this.commandRouter.routeAll('drafts.cgi', authorize({requiresAuth: true, effectivePermission: 'viewdraft'}));

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

  this.createFunc = function(now, req, res, next) {
    user.createUser(req.entity, req.sitepath, req.body.username, req.body.fullname, now);
    req.entity.summary.abstract = req.body.profileText;
    mutateKey(req.body.profileUrl, req.entity.summary, 'profileUrl');
    mutateKey(req.body.email, req.entity.data, 'email');
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
    req.entity.summary.abstract = req.body.profileText;
    req.entity.summary.title = req.body.fullname;
    mutateKey(req.body.profileUrl, req.entity.summary, 'profileUrl');
    mutateKey(req.body.email, req.entity.data, 'email');
    req.entity.data.disableLogin = validator.toBoolean(req.body.disableLogin);
    res.expose({}, 'errors');
    update.updateEntity(req.db, req.ctx, req.access, oldent, req.entity, true, 'test', next);
  };

  this.validateForm = function(update, body, next) {
    var userForm = new UserForm(update);
    userForm.checkForm(body, next);
  };

  this.viewRouter.get('drafts.cgi', function(req, res, next) {
    res.format({
      'text/html': function() {
        view.basicView('drafts', 'drafts', null, req, res, next);
      }
    });
  });

  this.viewRouter.get('', view.basicViewWithJsonView.bind(this, 'user', 'view-user'));
  this.viewRouter.routeAll('password.html', view.basicView.bind(this, 'password', 'password'));
  this.viewRouter.get('grant.html', view.basicView.bind(this, undefined, 'view-user'));
}

util.inherits(UserPage, Page);

module.exports = UserPage;

