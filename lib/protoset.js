var Page = require('./page');
var util = require("util");
var update = require ('./update'),
    errs = require('errs'),
    validator = require('validator'),
    async = require('async'),
    user = require('./user'),
    logging = require('./logging'),
    i10n = require('./i10n'),
    SitePath = require ('sitepath'),
    UserForm = require('./forms/user.js'),
    authorize = require('./authorize'),
    mixins = require('./mixins'),
    view = require('./view'),
    protos = require('./protos');

var boundLogger = logging.getRootLogger('protoset');

function ValidationError() {
  this.httpResponseCode = 400;
  this.message = "VALIDATION_ERROR";
  Error.call(this);
}
util.inherits(ValidationError, Error);
i10n.intlErrorMixin(ValidationError);
errs.register('page.validation', ValidationError);

function FieldEmptyError() {
  this.httpResponseCode = 400;
  this.message = "FIELD_EMPTY";
  Error.call(this);
}
util.inherits(FieldEmptyError, ValidationError);
i10n.intlErrorMixin(FieldEmptyError);
errs.register('page.validation.empty', FieldEmptyError);

function InvalidRevisionId() {
  this.httpResponseCode = 400;
  this.message = "INVALID_REVISION_ID";
  Error.call(this);
}
util.inherits(InvalidRevisionId, ValidationError);
i10n.intlErrorMixin(InvalidRevisionId);
errs.register('page.validation.bad_revision_id', InvalidRevisionId);

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

var Protoset = function() {
  this._pages = {};
  this._metadata = {};
  this._listingDecorator = {};
  this.addProto('base', new protos.BasePage(), {desc: 'PROTO_BASE'});
  this.addProto('blog', new protos.BlogPage(), {desc: 'PROTO_BLOG'});
  this.addProto('comment', new protos.CommentPage(), {desc: 'PROTO_COMMENT'});
  this.addProto('index', new protos.TempIndexClass(), {desc: 'PROTO_INDEX', icon: 'folder'});
  this.addProto('user', new UserPage(), {desc: 'PROTO_USER'});
  this.addProto('meta', new protos.MetaIndexPage(), {desc: 'PROTO_META'});
  this.addProto('predicate', new protos.PredicatePage(), {desc: 'PROTO_PREDICATE'});
};

Protoset.prototype.addProto = function(tag, proto, metadata, listingDecorator) {
  this._pages[tag] = proto;
  this._metadata[tag] = metadata;
  if (listingDecorator) {
    this._listingDecorator[tag] = listingDecorator;
  }
};

Protoset.prototype.getPage = function(proto) {
  return this._pages[proto];
};

Protoset.prototype.listProtos = function() {
  return this._metadata;
};

Protoset.prototype.decorateListing = function(article, dbRow, scheme, site) {
  var tag = article.meta['rm3:proto'];
  if (!article.hasOwnProperty('meta')) {
    article.meta = {};
  }
  if (tag === 'comment') {
    article.description = dbRow.data.comment;
    if (dbRow.summary.author) {
      var authorPath = new SitePath(dbRow.summary.author);
      article.meta['atom:author'] = {uri: site.sitePathToUrl(authorPath)};
      article.meta['rm3:authorPath'] = authorPath;
      article.author = authorPath;
      if (dbRow.actorSummary) {
        if (dbRow.actorSummary.profileUrl) {
          article.meta['atom:author'].uri = dbRow.actorSummary.profileUrl;
        }
        article.meta['atom:author'].name = dbRow.actorSummary.title;
        article.author = dbRow.actorSummary.title;
      }
    }
  }
  if (this._metadata.hasOwnProperty(tag) && this._metadata[tag].hasOwnProperty('icon')) {
    article.meta['rm3:icon'] = {
      '24': {'svg': scheme.getResourcePath('images/icon-' +
                this._metadata[tag].icon + '.svg'),
             'alt': scheme.getResourcePath('images/icon-' +
                this._metadata[tag].icon + '-24.png'),
             'height': 24, 'width': 24},
      'sq': {'svg': scheme.getResourcePath('images/icon-' +
                this._metadata[tag].icon + '.svg'),
             'alt': scheme.getResourcePath('images/icon-' +
                this._metadata[tag].icon + '-75.png'),
             'height': 75, 'width': 75}
    };
  } else {
    article.meta['rm3:icon'] = {
      '24': {'svg': scheme.getResourcePath('images/icon-document.svg'),
             'alt': scheme.getResourcePath('images/icon-document-24.png'),
             'height': 24, 'width': 24},
      'sq': {'svg': scheme.getResourcePath('images/icon-document.svg'),
             'alt': scheme.getResourcePath('images/icon-document-75.png'),
             'height': 75, 'width': 75}
    };
  }
  return article;
};

module.exports = exports = new Protoset();
