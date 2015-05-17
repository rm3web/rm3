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

function to_slug(url) {
  return getSlug(url, {
    separator: '_',
    truncate: -48,
    custom: {
      '-': '_'
    }
  });
}

function checkFieldsPresent(body, fields, next) {
  var bad_fields = [];
  fields.forEach(function(element, index, array) {
    if (validator.isNull(body[element])) {
      bad_fields.push(element);
    }
  });
  if (bad_fields.length > 0) {
    next(errs.create('page.validation.empty', {
      field: bad_fields
    }));
    return true;
  } else {
    return false;
  }
}

function combo_check(formval, obj, key, valid, create) {
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
      query.fetch_effective_permissions(req.db, user.path(), req.sitepath, function(err, effPerm) {
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

function basic_view(section, template, req, res, next) {
  var view = req.entity.view();
  view.user = req.user;
  view.error_message = req.flash('error');
  view.info_message = req.flash('info');
  view.section = section;
  view.path = req.sitepath.toDottedPath();
  view.leaf = req.entity.path().leaf();
  req.scheme.render(template, view, req.page._renderPageResponse.bind(this, req, res));
}

function DeletableMixin(page) {
  page.commandRouter.route_all('delete.html', authorize({requiresAuth: true, permission: "delete"}));

  page.commandRouter.get('delete.html', function(req, res, next)
  {
    if (req.query.sure === 'yes') {
      req.flash('info', 'Page deleted');
      update.delete_entity(req.db, req.entity, true, 'delete', next);
    } else {
      req.flash('error', 'Page not deleted');
      next();
    }
  });
  page.viewRouter.route_all('delete.html', function(req, res, next) 
  {
    return res.redirect(req.sitepath.up().toUrl('/',1));
  });
}

function BaseBehaviorMixin(page) {
  page.commandRouter.route_all('edit.html', authorize({requiresAuth: true, permission: 'edit'}));
  page.commandRouter.route_all('create.html', authorize({requiresAuth: true, effectivePermission: 'edit'}));
  page.commandRouter.route_all('tag.html', authorize({requiresAuth: true, effectivePermission: 'edit'}));

  page.commandRouter.post('tag.html', function(req, res, next)
  {
    var oldent = req.entity.clone();
    if (req.body.action === "addtag") {
      req.entity.addTag(null,req.body.obj_key);
      update.update_entity(req.db, oldent, req.entity, true, 'test', next);
    } else if(req.body.action === "rmtag") {
      req.entity.removeTag(null,req.body.obj_key);
      update.update_entity(req.db, oldent, req.entity, true, 'test', next);
    } else if(req.body.action === "navbar") {
      req.entity.addTag("navigation","navbar");
      update.update_entity(req.db, oldent, req.entity, true, 'test', next);
    } else {
      return next(errs.create('page.validation', {
        msg: "invalid tagging action"
      }));
    }
  });

  page.commandRouter.post('edit.html', function(req, res, next)
  {
    var oldent = req.entity.clone();
    req.entity.data.posting = textblocks.makeTextBlock(req.body.posting,validator.toString(req.body.textblock_format));
    req.entity.updateTimes(new Date());
    update.update_entity(req.db, oldent, req.entity, true, 'test', next);
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

    if (validator.toBoolean(req.body.autogen_slug)) {
      var slug = to_slug(req.body.title);
      req.entity.createNew(req.sitepath.down(slug), req.page.proto, now);
    } else {
      if (validator.isNull(req.body.path)) {
        return next(errs.create('page.validation.empty', {
         field: 'path'
        }));
      }
      req.entity.createNew(req.sitepath.down(req.body.path), req.page.proto, now);
    }
    req.entity.data.posting = textblocks.makeTextBlock(req.body.posting, validator.toString(req.body.textblock_format));
    req.entity.summary.title = req.body.title;
    req.entity.summary.abstract = req.body.abstract;
    update.create_entity(req.db, req.entity, true, 'test', 
    function(err, entity_id, revision_id, revision_num) {
      if (err) {
        return next(err);
      } else {
        return res.redirect(req.sitepath.down(req.body.path).toUrl('/',1));
      }
    });
  });

  page.viewRouter.route_all('edit.html', basic_view.bind(this, 'edit', 'edit'));
  page.viewRouter.route_all('create.html', basic_view.bind(this, 'create', 'create'));
  page.viewRouter.route_all('tag.html', basic_view.bind(this, 'tag', 'tag'));
}


function HistoryViewMixin(page) {
  page.viewRouter.get('history.html', basic_view.bind(this, 'history', 'history'));
}


function BasePage() {
  Page.call(this);
  this.proto = 'base';
  DeletableMixin(this);
  BaseBehaviorMixin(this);
  HistoryViewMixin(this);

  this.viewRouter.get('', basic_view.bind(this,undefined, 'view'));
}

util.inherits(BasePage, Page);

function TempIndexClass() {
  Page.call(this);
  this.proto = 'index';
  DeletableMixin(this);
  BaseBehaviorMixin(this);
  HistoryViewMixin(this);

  this.viewRouter.get('', basic_view.bind(this,undefined, 'index'));
}

util.inherits(TempIndexClass, Page);

function encode_password_or_not(password, entity, bypass, next) {
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

  this.commandRouter.route_all('edit.html', authorize({requiresAuth: true, permission: 'edit'}));
  this.commandRouter.route_all('create.html', authorize({requiresAuth: true, effectivePermission: 'edit'}));

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

    if (!combo_check(req.body.profile_url, req.entity.summary, 'profile_url',
        validator.isURL, false)) {
      return next(errs.create('page.validation', {
        field: 'profile_url'
      }));
    }

    if (!combo_check(req.body.email, req.entity.data, 'email',
        validator.isEmail, false)) {
      return next(errs.create('page.validation', {
        field: 'email'
      }));
    }


    req.entity.summary.title = req.body.fullname;

    encode_password_or_not(req.body.password1, req.entity, !req.body.password1, function(err) {
      if (err) {
        return next(err);
      }
      
      update.update_entity(req.db, oldent, req.entity, true, 'test', next);
    });
    
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

    if (!combo_check(req.body.profile_url, req.entity.summary, 'profile_url',
        validator.isURL, true)) {
      return next(errs.create('page.validation', {
        field: 'profile_url'
      }));
    }

    if (!combo_check(req.body.email, req.entity.data, 'email',
        validator.isEmail, true)) {
      return next(errs.create('page.validation', {
        field: 'email'
      }));
    }

    encode_password_or_not(req.body.password1, req.entity, !req.body.password1, function(err) {
      if (err) {
        return next(err);
      }

      update.create_entity(req.db, req.entity, true, 
                           'test', function(err, entity_id, revision_id, revision_num) {
        if (err) {
          return next(err);
        } else {
          return res.redirect(req.sitepath.down(req.body.path).toUrl('/',1));
        }
      });
    });
  });

  this.viewRouter.get('', basic_view.bind(this,undefined, 'view-user'));
  this.viewRouter.route_all('edit.html', basic_view.bind(this, 'edit', 'edit-user'));
  this.viewRouter.route_all('create.html', basic_view.bind(this, 'create', 'edit-user'));
}

util.inherits(UserPage, Page);

var Protoset = function () {
  this._pages = {};
  this._metadata = {};
  this.add_proto('base', new BasePage(), {desc: 'Default Node'});
  this.add_proto('index', new TempIndexClass(), {desc: 'Index (temp)'});
  this.add_proto('user', new UserPage(), {desc: 'User'});
};

Protoset.prototype.add_proto = function(tag, proto, metadata) {
  this._pages[tag] = proto;
  this._metadata[tag] = metadata;
};

Protoset.prototype.get_page = function(proto) {
  return this._pages[proto];
};

Protoset.prototype.list_protos = function() {
  return this._metadata;
};

module.exports = exports = new Protoset();