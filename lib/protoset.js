var Page = require('../lib/page');
var util = require("util");
var update = require ('./update'),
    errs = require('errs'),
    getSlug = require('speakingurl'),
    validator = require('validator'),
    textblocks = require('textblocks'),
    user = require('./user'),
    query = require('./query'),
    logging = require('./logging'),
    i10n = require('./i10n'),
    SitePath = require ('./sitepath');

var boundLogger = logging.getRootLogger('protoset');

function ValidationError() {
  this.httpResponseCode = 400;
  this.message = "VALIDATION_ERROR";
  Error.call(this);
}
util.inherits(ValidationError, Error);
i10n.intlErrorMixin(ValidationError);
errs.register('page.validation', ValidationError);

function NotAllowedError() {
  this.httpResponseCode = 403;
  this.message = "THIS_ACTION_IS_NOT_PERMITTED";
  Error.call(this);
}
util.inherits(NotAllowedError, Error);
i10n.intlErrorMixin(NotAllowedError);
errs.register('page.not_allowed', NotAllowedError);

function FieldEmptyError() {
  this.httpResponseCode = 400;
  this.message = "FIELD_EMPTY";
  Error.call(this);
}
util.inherits(FieldEmptyError, ValidationError);
i10n.intlErrorMixin(FieldEmptyError);
errs.register('page.validation.empty', FieldEmptyError);

function toSlug(url) {
  return getSlug(url, {
    separator: '_',
    truncate: -48,
    custom: {
      '-': '_'
    }
  });
}

function checkFieldsPresent(ctx, body, fields, next) {
  var badFields = [];
  fields.forEach(function(element, index, array) {
    if (validator.isNull(body[element])) {
      badFields.push(element);
    }
  });
  if (badFields.length > 0) {
    logging.logAndCreateError(boundLogger, 'checkFieldsPresent',
      'page.validation.empty', {
      ctx: ctx,
      field: badFields
    }, next);
    return true;
  } else {
    return false;
  }
}

function comboCheck(formval, obj, key, valid, create) {
  if (!validator.isNull(formval)) {
    if (!valid(formval)) {
      return false;
    } else {
      obj[key] = formval;
    }
  } else {
    if (obj.hasOwnProperty(key)) {
      delete obj[key];
    }
  }
  return true;
}

function authorize(options) {
  return function auth(req, res, next) {
    var user = req.user;
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
      query.fetchEffectivePermissions(req.db, req.ctx, user.path(), req.sitepath, function(err, effPerm) {
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

function doPragmaBlocks(db, view, block, next) {
  var path = new SitePath(view.meta.sitePath);
  var security = {context: 'STANDARD'};
  var user = view.user;
  var ctx = view.ctx;
  if (user !== undefined) {
    security.user = user.path();
  }
  var resp = query.query(db, ctx, security, path, block.query,
    'entity', {}, undefined, undefined);
  var str = '<ul>';
  resp.on('article', function(article) {
    str += '<li><a href="' + article.path.toUrl('/', 1) + '">' +
      article.title + "</a></li>";
  });
  resp.on('error', function(err) {
    next(err);
  });
  resp.on('end', function() {
    next(null, {format: 'html', htmltext: str + '</ul>'});
  });
}

function basicView(section, template, resolve, req, res, next) {
  var view = req.entity.view();
  view.user = req.user;
  view.errorMessage = req.flash('error');
  view.infoMessage = req.flash('info');
  view.section = section;
  view.path = req.sitepath.toDottedPath();
  view.leaf = req.entity.path().leaf();
  view.ctx = req.ctx;
  view.intl = i10n.getIntl();
  view.site = req.site;
  res.expose(view.intl,'intl');
  view.expose = res.locals.state.toString();

  if (resolve) {
    textblocks.resolvePragmaBlocks(view.data[resolve],
      doPragmaBlocks.bind(this, req.db, view), function(err, block) {
      if (err) {
        next(err);
      }
      view.data[resolve] = block;
      return req.scheme.render(template, view, req.page._renderPageResponse.bind(this, req, res));
    });
  } else {
    return req.scheme.render(template, view, req.page._renderPageResponse.bind(this, req, res));
  }
}

function DeletableMixin(page) {
  page.commandRouter.routeAll('delete.html', authorize({requiresAuth: true, permission: "delete"}));

  page.commandRouter.get('delete.html', function(req, res, next) {
    if (req.query.sure === 'yes') {
      req.flash('info', 'Page deleted');
      update.deleteEntity(req.db, req.ctx, req.entity, true, 'delete', next);
    } else {
      req.flash('error', 'Page not deleted');
      next();
    }
  });
  page.viewRouter.routeAll('delete.html', function(req, res, next) {
    return res.redirect(req.sitepath.up().toUrl('/', 1));
  });
}

function BaseBehaviorMixin(page) {
  page.commandRouter.routeAll('edit.html', authorize({requiresAuth: true, permission: 'edit'}));
  page.commandRouter.routeAll('create.html', authorize({requiresAuth: true, effectivePermission: 'edit'}));
  page.commandRouter.routeAll('tag.html', authorize({requiresAuth: true, effectivePermission: 'edit'}));

  page.commandRouter.post('tag.html', function(req, res, next) {
    var oldent = req.entity.clone();
    if (req.body.action === "addtag") {
      req.entity.addTag(null, req.body.objKey);
      update.updateEntity(req.db, req.ctx, oldent, req.entity, true, 'test', next);
    } else if (req.body.action === "rmtag") {
      req.entity.removeTag(null, req.body.objKey);
      update.updateEntity(req.db, req.ctx, oldent, req.entity, true, 'test', next);
    } else if (req.body.action === "navbar") {
      req.entity.addTag("navigation", "navbar");
      update.updateEntity(req.db, req.ctx, oldent, req.entity, true, 'test', next);
    } else {
      return logging.logAndCreateError(boundLogger, 'tag.html bad action',
            'page.validation', {
            ctx: req.ctx,
            msg: "invalid tagging action"
          }, next);
    }
  });

  page.commandRouter.post('edit.html', function(req, res, next) {
    var oldent = req.entity.clone();
    req.entity.data.posting = textblocks.validateTextBlock(req.body.posting);
    req.entity.updateTimes(new Date());
    update.updateEntity(req.db, req.ctx, oldent, req.entity, true, 'test', next);
  });
  page.commandRouter.get('create.html', function(req, res, next) {
    var now = new Date();
    req.entity.createNew(req.sitepath.down(req.body.path), req.page.proto, now);
    req.entity.data.posting = textblocks.makeTextBlock('', 'html');
    next();
  });
  page.commandRouter.post('create.html', function(req, res, next) {
    var now = new Date();
    if (checkFieldsPresent(req.ctx, req.body, ['title'], next)) {
      return null;
    }

    if (validator.toBoolean(req.body.autogenSlug)) {
      var slug = toSlug(req.body.title);
      req.entity.createNew(req.sitepath.down(slug), req.page.proto, now);
    } else {
      if (validator.isNull(req.body.path)) {
        return logging.logAndCreateError(boundLogger, 'create.html bad path',
            'page.validation.empty', {
            ctx: req.ctx,
            field: ['path']
          }, next);
      }
      req.entity.createNew(req.sitepath.down(req.body.path), req.page.proto, now);
    }
    req.entity.data.posting = textblocks.validateTextBlock(req.body.posting);
    req.entity.summary.title = req.body.title;
    req.entity.summary.abstract = req.body.abstract;
    update.createEntity(req.db, req.ctx, req.entity, true, 'test',
    function(err, entityId, revisionId, revisionNum) {
      if (err) {
        return next(err);
      } else {
        return res.redirect(req.sitepath.down(req.body.path).toUrl('/', 1));
      }
    });
  });

  page.viewRouter.routeAll('edit.html', basicView.bind(this, 'edit', 'edit', null));
  page.viewRouter.routeAll('create.html', basicView.bind(this, 'create', 'create', null));
  page.viewRouter.routeAll('tag.html', basicView.bind(this, 'tag', 'tag', null));
}

function HistoryViewMixin(page) {
  page.viewRouter.get('history.html', basicView.bind(this, 'history', 'history', null));
}

function BasePage() {
  Page.call(this);
  this.proto = 'base';
  DeletableMixin(this);
  BaseBehaviorMixin(this);
  HistoryViewMixin(this);

  this.viewRouter.get('', basicView.bind(this, undefined, 'view', null));
}

util.inherits(BasePage, Page);

function TempIndexClass() {
  Page.call(this);
  this.proto = 'index';
  DeletableMixin(this);
  BaseBehaviorMixin(this);
  HistoryViewMixin(this);

  this.viewRouter.get('', basicView.bind(this, undefined, 'index', 'posting'));
}

util.inherits(TempIndexClass, Page);

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
  DeletableMixin(this);
  HistoryViewMixin(this);

  this.commandRouter.routeAll('edit.html', authorize({requiresAuth: true, permission: 'edit'}));
  this.commandRouter.routeAll('create.html', authorize({requiresAuth: true, effectivePermission: 'edit'}));

  this.commandRouter.post('edit.html', function(req, res, next) {
    var oldent = req.entity.clone();

    req.entity.updateTimes(new Date());

    if (checkFieldsPresent(req.ctx, req.body, ['fullname'], next)) {
      return logging.logAndCreateError(boundLogger, 'edit.html bad field',
          'page.validation.empty', {
          ctx: req.ctx,
          msg: "required fields missing",
          field: ['fullname']
        }, next);
    }

    if (req.body.password1 !== req.body.password2) {
      return logging.logAndCreateError(boundLogger, 'edit.html pw1 pw2',
          'page.validation', {
          ctx: req.ctx,
          msg: "passwords don't match",
          field: ['password1', 'password2']
        }, next);
    }

    if (!comboCheck(req.body.profileUrl, req.entity.summary, 'profileUrl',
        validator.isURL, false)) {
      return logging.logAndCreateError(boundLogger, 'edit.html profileUrl',
          'page.validation', {
          ctx: req.ctx,
          msg: "bad profile url",
          field: ['profileUrl']
        }, next);
    }

    if (!comboCheck(req.body.email, req.entity.data, 'email',
        validator.isEmail, false)) {
      return logging.logAndCreateError(boundLogger, 'edit.html email',
          'page.validation', {
          ctx: req.ctx,
          msg: "bad email",
          field: ['email']
        }, next);
    }

    req.entity.summary.title = req.body.fullname;

    encodePasswordOrNot(req.body.password1, req.entity, !req.body.password1, function(err) {
      if (err) {
        return next(err);
      }

      update.updateEntity(req.db, req.ctx, oldent, req.entity, true, 'test', next);
    });
  });

  this.commandRouter.get('create.html', function(req, res, next) {
    var now = new Date();
    req.entity.createNew(req.sitepath.down(req.body.path), req.page.proto, now);
    next();
  });

  this.commandRouter.post('create.html', function(req, res, next) {
    var now = new Date();
    if (checkFieldsPresent(req.ctx, req.body, ['username', 'fullname'], next)) {
      return logging.logAndCreateError(boundLogger, 'create.html bad field',
          'page.validation.empty', {
          ctx: req.ctx,
          msg: "required fields missing",
          field: ['username', 'fullname']
        }, next);
    }

    user.createUser(req.entity, req.sitepath, req.body.username, req.body.fullname, now);

    req.entity.summary.abstract = req.body.abstract;

    if (req.body.password1 !== req.body.password2) {
      return logging.logAndCreateError(boundLogger, 'create.html pw1 pw2',
          'page.validation', {
          ctx: req.ctx,
          msg: "passwords don't match",
          field: ['password1', 'password2']
        }, next);
    }

    if (!comboCheck(req.body.profileUrl, req.entity.summary, 'profileUrl',
        validator.isURL, true)) {
      return logging.logAndCreateError(boundLogger, 'create.html profileUrl',
          'page.validation', {
          ctx: req.ctx,
          msg: "bad profile url",
          field: ['profileUrl']
        }, next);
    }

    if (!comboCheck(req.body.email, req.entity.data, 'email',
        validator.isEmail, true)) {
      return logging.logAndCreateError(boundLogger, 'create.html email',
          'page.validation', {
          ctx: req.ctx,
          msg: "bad email",
          field: ['email']
        }, next);
    }

    encodePasswordOrNot(req.body.password1, req.entity, !req.body.password1, function(err) {
      if (err) {
        return next(err);
      }

      update.createEntity(req.db, req.ctx, req.entity, true,
                           'test', function(err, entityId, revisionId, revisionNum) {
        if (err) {
          return next(err);
        } else {
          return res.redirect(req.sitepath.down(req.body.path).toUrl('/', 1));
        }
      });
    });
  });

  this.viewRouter.get('', basicView.bind(this, undefined, 'view-user', null));
  this.viewRouter.routeAll('edit.html', basicView.bind(this, 'edit', 'edit-user', null));
  this.viewRouter.routeAll('create.html', basicView.bind(this, 'create', 'edit-user', null));
}

util.inherits(UserPage, Page);

var Protoset = function() {
  this._pages = {};
  this._metadata = {};
  this.addProto('base', new BasePage(), {desc: 'Default Node'});
  this.addProto('index', new TempIndexClass(), {desc: 'Index (temp)'});
  this.addProto('user', new UserPage(), {desc: 'User'});
};

Protoset.prototype.addProto = function(tag, proto, metadata) {
  this._pages[tag] = proto;
  this._metadata[tag] = metadata;
};

Protoset.prototype.getPage = function(proto) {
  return this._pages[proto];
};

Protoset.prototype.listProtos = function() {
  return this._metadata;
};

module.exports = exports = new Protoset();
