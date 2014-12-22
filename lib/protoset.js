var Page = require('../lib/page');
var util = require("util");
var update = require ('./update'),
  errs = require('errs'),
  getSlug = require('speakingurl'),
  validator = require('validator'),
  textblocks = require('textblocks');
var user = require('./user');

function ValidationError() {
  this.message = "Validation Error";
}
util.inherits(ValidationError, Error);
errs.register('page.validation', ValidationError);

function FieldEmptyError() {
  this.message = "Field Empty";
}
util.inherits(FieldEmptyError, ValidationError);
errs.register('page.validation.empty', FieldEmptyError);



function to_slug(url) {
  return getSlug(url, {
    separator: '_',
    truncate: 48,
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

function BaseBehaviorMixin(page) {
  page.view_router.addRoute('/GET/', function(req, res, page, next) 
  {
    var view = req.entity.view();
    view.user = req.user;
    req.scheme.render('view', view, page._renderPageResponse.bind(this, req, res));
  });
  page.command_router.addRoute('/POST/edit', function(req, res, page, db, next)
  {
    var oldent = req.entity.clone();
    req.entity.data.posting = textblocks.makeTextBlock(req.body.posting,validator.toString(req.body.textblock_format));
    req.entity.updateTimes(new Date());
    update.update_entity(db, oldent, req.entity, true, 'test', next);
  });
  page.command_router.addRoute('/GET/delete', function(req, res, page, db, next)
  {
    if (req.query.sure === 'yes') {
      update.delete_entity(db, req.entity, true, 'delete', next);
    } else {
      next();
    }
  });
  page.command_router.addRoute('/GET/create', function(req, res, page, db, next)
  {
    var now = new Date();
    req.entity.createNew(req.sitepath.down(req.body.path), page.proto, now);
    next();
  });
  page.command_router.addRoute('/POST/create', function(req, res, page, db, next)
  {
    var now = new Date();
    if (checkFieldsPresent(req.body, ['title'], next)) {
      return null;
    }

    if (validator.toBoolean(req.body.autogen_slug)) {
      var slug = to_slug(req.body.title);
      req.entity.createNew(req.sitepath.down(slug), page.proto, now);
    } else {
      if (validator.isNull(req.body.path)) {
        return next(errs.create('page.validation.empty', {
         field: 'path'
        }));
      }
      req.entity.createNew(req.sitepath.down(req.body.path), page.proto, now);
    }
    req.entity.data.posting = textblocks.makeTextBlock(req.body.posting, validator.toString(req.body.textblock_format));
    req.entity.summary.title = req.body.title;
    req.entity.summary.abstract = req.body.abstract;
    update.create_entity(db, req.entity, true, 'test', 
    function(err, entity_id, revision_id, revision_num) {
      if (err) {
        return next(err);
      } else {
        return res.redirect(req.sitepath.down(req.body.path).toUrl('/',1));
      }
    });
  });
  page.view_router.addRoute('/*/edit', function(req, res, page, next) 
  {
    var view = req.entity.view();
    view.user = req.user;
    view.section = 'edit';
    req.scheme.render('edit', view, page._renderPageResponse.bind(this, req, res));
  });
  page.view_router.addRoute('/*/create', function(req, res, page, next) 
  {
    var view = req.entity.view();
    view.user = req.user;
    view.section = 'create';
    view.path = req.sitepath.toDottedPath();
    req.scheme.render('create', view, page._renderPageResponse.bind(this, req, res));
  });
  page.view_router.addRoute('/*/delete', function(req, res, page, next) 
  {
    var view = {meta: {modified: null, created:null}};
    view.user = req.user;
    view.section = 'delete';
    view.message = 'deleted';
    req.scheme.render('message', view, page._renderPageResponse.bind(this, req, res));
  });
}


function HistoryViewMixin(page) {
  page.view_router.addRoute('/GET/history', function(req, res, page, next) 
  {
    var view = req.entity.view();
    view.section = 'history';
    req.scheme.render('history', view, page._renderPageResponse.bind(this, req, res));
  });
}


function BasePage() {
  Page.call(this);
  this.proto = 'base';
  BaseBehaviorMixin(this);
  HistoryViewMixin(this);
}

util.inherits(BasePage, Page);

function TempIndexClass() {
  BasePage.call(this);
  this.proto = 'index';
  this.view_router.addRoute('/GET/', function(req, res, page, next) 
  {
    var view = req.entity.view();
    view.user = req.user;
    req.scheme.render('index', view, page._renderPageResponse.bind(this, req, res));
  });
}

util.inherits(TempIndexClass, BasePage);

function encode_password_or_not(password, entity, bypass, next) {
  if (!bypass) {
    user.encodePassword(password, entity, next);
  } else {
    next();
  }
}

function UserPage() {
  BasePage.call(this);
  this.proto = 'user';
  this.command_router.addRoute('/POST/edit', function(req, res, page, db, next)
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
      
      update.update_entity(db, oldent, req.entity, true, 'test', next);
    });
    
  });
  this.command_router.addRoute('/POST/create', function(req, res, page, db, next)
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

      update.create_entity(db, req.entity, true, 
                           'test', function(err, entity_id, revision_id, revision_num) {
        if (err) {
          return next(err);
        } else {
          return res.redirect(req.sitepath.down(req.body.path).toUrl('/',1));
        }
      });
    });
  });

  this.view_router.addRoute('/GET/', function(req, res, page, next) 
  {
    var view = req.entity.view();
    view.user = req.user;
    req.scheme.render('view-user', view, page._renderPageResponse.bind(this, req, res));
  });
  this.view_router.addRoute('/*/edit', function(req, res, page, next) 
  {
    var view = req.entity.view();
    view.user = req.user;
    view.section = 'edit';
    view.leaf = req.entity.path().leaf();
    req.scheme.render('edit-user', view, page._renderPageResponse.bind(this, req, res));
  });
  this.view_router.addRoute('/*/create', function(req, res, page, next) 
  {
    var view = req.entity.view();
    view.user = req.user;
    view.section = 'create';
    view.path = req.sitepath.toDottedPath();
    req.scheme.render('edit-user', view, page._renderPageResponse.bind(this, req, res));
  });
}

util.inherits(UserPage, BasePage);

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