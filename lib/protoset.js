var Page = require('../lib/page');
var util = require("util");
var update = require ('./update'),
  errs = require('errs'),
  getSlug = require('speakingurl'),
  validator = require('validator'),
  textblocks = require('textblocks'),
  user = require('./user'),
  query = require('./query');


function ValidationError() {
  this.message = "Validation Error";
}
util.inherits(ValidationError, Error);
errs.register('page.validation', ValidationError);

function NotAllowedError() {
  this.message = "This action is not permitted";
}
util.inherits(NotAllowedError, Error);
errs.register('page.not_allowed', NotAllowedError);

function FieldEmptyError() {
  this.message = "Field Empty";
}
util.inherits(FieldEmptyError, ValidationError);
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

function checkFieldsPresent(body, fields, next) {
  var badFields = [];
  fields.forEach(function(element, index, array) {
    if (validator.isNull(body[element])) {
      badFields.push(element);
    }
  });
  if (badFields.length > 0) {
    next(errs.create('page.validation.empty', {
      field: badFields
    }));
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
      return next(errs.create('page.not_allowed', {
        reason: "Only allowed for logged in users"
      }));
    }

    if (options.permission && 
      !permissions.hasOwnProperty(options.permission)) {
      return next(errs.create('page.not_allowed', {
        reason: "Your user does not have the required permission"
      }));
    }

    if (options.effectivePermission) {
      query.fetchEffectivePermissions(req.db, user.path(), req.sitepath, function(err, effPerm) {
        if (err) {
          next(err);
        }
        if (!effPerm.hasOwnProperty(options.effectivePermission)) {
          return next(errs.create('page.not_allowed', {
            reason: "Your user does not have the required permission"
          }));
        }
      });
    }
    next();
  };
}

function basicView(section, template, req, res, next) {
  var view = req.entity.view();
  view.user = req.user;
  view.errorMessage = req.flash('error');
  view.infoMessage = req.flash('info');
  view.section = section;
  view.path = req.sitepath.toDottedPath();
  view.leaf = req.entity.path().leaf();
  req.scheme.render(template, view, req.page._renderPageResponse.bind(this, req, res));
}

function DeletableMixin(page) {
  page.commandRouter.routeAll('delete.html', authorize({requiresAuth: true, permission: "delete"}));

  page.commandRouter.get('delete.html', function(req, res, next)
  {
    if (req.query.sure === 'yes') {
      req.flash('info', 'Page deleted');
      update.deleteEntity(req.db, req.entity, true, 'delete', next);
    } else {
      req.flash('error', 'Page not deleted');
      next();
    }
  });
  page.viewRouter.routeAll('delete.html', function(req, res, next) 
  {
    return res.redirect(req.sitepath.up().toUrl('/',1));
  });
}

function BaseBehaviorMixin(page) {
  page.commandRouter.routeAll('edit.html', authorize({requiresAuth: true, permission: 'edit'}));
  page.commandRouter.routeAll('create.html', authorize({requiresAuth: true, effectivePermission: 'edit'}));
  page.commandRouter.routeAll('tag.html', authorize({requiresAuth: true, effectivePermission: 'edit'}));

  page.commandRouter.post('tag.html', function(req, res, next)
  {
    var oldent = req.entity.clone();
    if (req.body.action === "addtag") {
      req.entity.addTag(null,req.body.objKey);
      update.updateEntity(req.db, oldent, req.entity, true, 'test', next);
    } else if(req.body.action === "rmtag") {
      req.entity.removeTag(null,req.body.objKey);
      update.updateEntity(req.db, oldent, req.entity, true, 'test', next);
    } else if(req.body.action === "navbar") {
      req.entity.addTag("navigation","navbar");
      update.updateEntity(req.db, oldent, req.entity, true, 'test', next);
    } else {
      return next(errs.create('page.validation', {
        msg: "invalid tagging action"
      }));
    }
  });

  page.commandRouter.post('edit.html', function(req, res, next)
  {
    var oldent = req.entity.clone();
    req.entity.data.posting = textblocks.makeTextBlock(req.body.posting,validator.toString(req.body.textblockFormat));
    req.entity.updateTimes(new Date());
    update.updateEntity(req.db, oldent, req.entity, true, 'test', next);
  });
  page.commandRouter.get('create.html', function(req, res, next)
  {
    var now = new Date();
    req.entity.createNew(req.sitepath.down(req.body.path), req.page.proto, now);
    next();
  });
  page.commandRouter.post('create.html', function(req, res, next)
  {
    var now = new Date();
    if (checkFieldsPresent(req.body, ['title'], next)) {
      return null;
    }

    if (validator.toBoolean(req.body.autogenSlug)) {
      var slug = toSlug(req.body.title);
      req.entity.createNew(req.sitepath.down(slug), req.page.proto, now);
    } else {
      if (validator.isNull(req.body.path)) {
        return next(errs.create('page.validation.empty', {
          field: 'path'
        }));
      }
      req.entity.createNew(req.sitepath.down(req.body.path), req.page.proto, now);
    }
    req.entity.data.posting = textblocks.makeTextBlock(req.body.posting, validator.toString(req.body.textblockFormat));
    req.entity.summary.title = req.body.title;
    req.entity.summary.abstract = req.body.abstract;
    update.createEntity(req.db, req.entity, true, 'test', 
    function(err, entityId, revisionId, revisionNum) {
      if (err) {
        return next(err);
      } else {
        return res.redirect(req.sitepath.down(req.body.path).toUrl('/',1));
      }
    });
  });

  page.viewRouter.routeAll('edit.html', basicView.bind(this, 'edit', 'edit'));
  page.viewRouter.routeAll('create.html', basicView.bind(this, 'create', 'create'));
  page.viewRouter.routeAll('tag.html', basicView.bind(this, 'tag', 'tag'));
}


function HistoryViewMixin(page) {
  page.viewRouter.get('history.html', basicView.bind(this, 'history', 'history'));
}


function BasePage() {
  Page.call(this);
  this.proto = 'base';
  DeletableMixin(this);
  BaseBehaviorMixin(this);
  HistoryViewMixin(this);

  this.viewRouter.get('', basicView.bind(this,undefined, 'view'));
}

util.inherits(BasePage, Page);

function TempIndexClass() {
  Page.call(this);
  this.proto = 'index';
  DeletableMixin(this);
  BaseBehaviorMixin(this);
  HistoryViewMixin(this);

  this.viewRouter.get('', basicView.bind(this,undefined, 'index'));
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

  this.commandRouter.post('edit.html', function(req, res, next)
  {
    var oldent = req.entity.clone();

    req.entity.updateTimes(new Date());

    if (checkFieldsPresent(req.body, ['fullname'], next)) {
      return next(errs.create('page.validaton', {
        msg: "required fields missing"
      }));
    }

    if (req.body.password1 !== req.body.password2) {
      return next(errs.create('page.validation', {
        msg: "passwords don't match"
      }));
    }

    if (!comboCheck(req.body.profileUrl, req.entity.summary, 'profileUrl',
        validator.isURL, false)) {
      return next(errs.create('page.validation', {
        field: 'profileUrl'
      }));
    }

    if (!comboCheck(req.body.email, req.entity.data, 'email',
        validator.isEmail, false)) {
      return next(errs.create('page.validation', {
        field: 'email'
      }));
    }


    req.entity.summary.title = req.body.fullname;

    encodePasswordOrNot(req.body.password1, req.entity, !req.body.password1, function(err) {
      if (err) {
        return next(err);
      }
      
      update.updateEntity(req.db, oldent, req.entity, true, 'test', next);
    });
    
  });

  this.commandRouter.get('create.html', function(req, res, next)
  {
    var now = new Date();
    req.entity.createNew(req.sitepath.down(req.body.path), req.page.proto, now);
    next();
  });

  this.commandRouter.post('create.html', function(req, res, next)
  {
    var now = new Date();
    if (checkFieldsPresent(req.body, ['username', 'fullname'], next)) {
      return next(errs.create('page.validaton', {
        msg: "required fields missing"
      }));
    }

    user.createUser(req.entity, req.sitepath, req.body.username, req.body.fullname, now);

    req.entity.summary.abstract = req.body.abstract;

    if (req.body.password1 !== req.body.password2) {
      return next(errs.create('page.validation', {
        msg: "passwords don't match"
      }));
    }

    if (!comboCheck(req.body.profileUrl, req.entity.summary, 'profileUrl',
        validator.isURL, true)) {
      return next(errs.create('page.validation', {
        field: 'profileUrl'
      }));
    }

    if (!comboCheck(req.body.email, req.entity.data, 'email',
        validator.isEmail, true)) {
      return next(errs.create('page.validation', {
        field: 'email'
      }));
    }

    encodePasswordOrNot(req.body.password1, req.entity, !req.body.password1, function(err) {
      if (err) {
        return next(err);
      }

      update.createEntity(req.db, req.entity, true, 
                           'test', function(err, entityId, revisionId, revisionNum) {
        if (err) {
          return next(err);
        } else {
          return res.redirect(req.sitepath.down(req.body.path).toUrl('/',1));
        }
      });
    });
  });

  this.viewRouter.get('', basicView.bind(this,undefined, 'view-user'));
  this.viewRouter.routeAll('edit.html', basicView.bind(this, 'edit', 'edit-user'));
  this.viewRouter.routeAll('create.html', basicView.bind(this, 'create', 'edit-user'));
}

util.inherits(UserPage, Page);

var Protoset = function () {
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