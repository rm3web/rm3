var Page = require('../page');
var mixins = require('../mixins');
var view = require('../view');
var util = require("util");
var UserForm = require('./forms/user.js');
var update = require ('../update'),
    user = require('./user'),
    authorize = require('./authorize'),
    logging = require('./logging'),
    validator = require('validator');

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

function encodePasswordOrNot(password, entity, bypass, next) {
  if (!bypass) {
    user.encodePassword(password, entity, next);
  } else {
    next();
  }
}

function UserPage() {
  Page.call(this);
  this.proto = 'user';
  mixins.DeletableMixin(this);
  mixins.HistoryViewMixin(this);
  mixins.TagSearchViewMixin(this);

  this.commandRouter.routeAll('edit.html', authorize({requiresAuth: true, permission: 'edit'}));
  this.commandRouter.routeAll('create.html', authorize({requiresAuth: true, effectivePermission: 'edit'}));
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

  this.commandRouter.post('edit.html', function(req, res, next) {
    var oldent = req.entity.clone();
    var userForm = new UserForm(true);
    userForm.checkForm(req.body, function(err) {
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
      } else {
        req.entity.updateTimes(new Date());
        req.entity.summary.abstract = req.body.profileText;
        req.entity.summary.title = req.body.fullname;
        mutateKey(req.body.profileUrl, req.entity.summary, 'profileUrl');
        mutateKey(req.body.email, req.entity.data, 'email');
        req.entity.data.disableLogin = validator.toBoolean(req.body.disableLogin);
        res.expose({}, 'errors');

        encodePasswordOrNot(req.body.password1, req.entity, !req.body.password1, function(err) {
          if (err) {
            return next(err);
          }
          update.updateEntity(req.db, req.ctx, req.access, oldent, req.entity, true, 'test', next);
        });
      }
    });
  });

  this.commandRouter.get('create.html', function(req, res, next) {
    var now = new Date();
    req.entity.createNew(req.sitepath.down(req.body.path), req.page.proto, now);
    next();
  });

  this.commandRouter.get('edit.html', function(req, res, next) {
    res.serverVars.leaf = req.sitepath.leaf();
    next();
  });

  this.viewRouter.get('drafts.cgi', function(req, res, next) {
    res.format({
      'text/html': function() {
        view.basicView('drafts', 'drafts', null, req, res, next);
      },
    });
  });

  this.commandRouter.post('create.html', function(req, res, next) {
    var now = new Date();
    var userForm = new UserForm(false);
    userForm.checkForm(req.body, function(err) {
      if (err) {
        res.status(400);
        res.expose(err, 'errors');
        res.serverVars.errors = err;
        res.serverVars.body = req.body;

        boundLogger.error('edit.html error', {
          ctx: req.ctx,
          details: err
        });
        return next();
      } else {
        user.createUser(req.entity, req.sitepath, req.body.username, req.body.fullname, now);
        req.entity.summary.abstract = req.body.profileText;
        mutateKey(req.body.profileUrl, req.entity.summary, 'profileUrl');
        mutateKey(req.body.email, req.entity.data, 'email');
        req.entity.data.disableLogin = validator.toBoolean(req.body.disableLogin);
        res.expose({}, 'errors');

        encodePasswordOrNot(req.body.password1, req.entity, !req.body.password1, function(err) {
          if (err) {
            return next(err);
          }

          update.createEntity(req.db, req.ctx, req.access, req.entity, true,
                               'test', function(err, entityId, revisionId, revisionNum) {
            if (err) {
              return next(err);
            } else {
              return res.redirect(req.site.sitePathToUrl(req.sitepath.down(req.body.path)));
            }
          });
        });
      }
    });
  });

  this.viewRouter.get('', view.basicViewWithJsonView.bind(this, undefined, 'view-user', null));
  this.viewRouter.get('grant.html', view.basicView.bind(this, undefined, 'view-user', null));
  this.viewRouter.routeAll('edit.html', view.basicView.bind(this, 'edit', 'edit-user', null));
  this.viewRouter.routeAll('create.html', view.basicView.bind(this, 'create', 'edit-user', null));
}

util.inherits(UserPage, Page);

module.exports = UserPage;
