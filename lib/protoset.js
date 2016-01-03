var Page = require('../lib/page');
var util = require("util");
var update = require ('./update'),
    errs = require('errs'),
    getSlug = require('speakingurl'),
    validator = require('validator'),
    textblocks = require('textblocks'),
    async = require('async'),
    user = require('./user'),
    query = require('./query'),
    logging = require('./logging'),
    i10n = require('./i10n'),
    SitePath = require ('sitepath'),
    UserForm = require('./forms/user.js'),
    PageForm = require('./forms/page.js'),
    IndexFeed = require('./indexfeed'),
    ActivityFeed = require('./activityfeed'),
    csurf = require('csurf'),
    uuid = require('node-uuid'),
    xssFilters = require('xss-filters'),
    downsize = require('downsize');

var csrfProtection = csurf();

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

function InvalidRevisionId() {
  this.httpResponseCode = 400;
  this.message = "INVALID_REVISION_ID";
  Error.call(this);
}
util.inherits(InvalidRevisionId, ValidationError);
i10n.intlErrorMixin(InvalidRevisionId);
errs.register('page.validation.bad_revision_id', InvalidRevisionId);

function toSlug(url) {
  return getSlug(url, {
    separator: '_',
    truncate: -48,
    custom: {
      '-': '_'
    }
  });
}

function mutateKey(formval, obj, key) {
  if (!validator.isNull(formval)) {
    obj[key] = formval;
  } else {
    if (obj.hasOwnProperty(key)) {
      delete obj[key];
    }
  }
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

function doPragmaBlocks(req, view, block, pos, next) {
  return IndexFeed.renderDirectIndexFeed(req, query, view, block, pos, next);
}

function basicView(section, template, resolve, req, res, next) {
  var view = req.entity.view();
  view.user = req.user;
  view.security = req.access;
  view.errorMessage = req.flash('error');
  view.infoMessage = req.flash('info');
  view.section = section;
  view.path = req.sitepath;
  view.protoset = req.protoset;
  view.scheme = req.scheme;
  if (req.user) {
    view.userPath = req.user.path();
    res.expose(req.protoset.listProtos(), 'protos');
    res.expose(req.site.sitePathToUrl(req.sitepath), 'baseurl');
  }
  if (req.entity.curLogRev) {
    view.curLogRev = req.entity.curLogRev;
  }
  view.ctx = req.ctx;
  view.intl = i10n.getIntl();
  view.site = req.site;
  res.expose(view.intl, 'intl');
  res.expose(view.section, 'section');
  res.expose(req.entity._proto, 'proto');
  res.expose(view.permissions, 'permissions');
  view.expose = res.locals.state.toString();
  for (var key in res.serverVars) {
    if (res.serverVars.hasOwnProperty(key)) {
      view[key] = res.serverVars[key];
    }
  }
  if (resolve) {
    textblocks.resolvePragmaBlocks(view.data[resolve], resolve,
      doPragmaBlocks.bind(this, req, view), function(err, block) {
      if (err) {
        return next(err);
      }
      view.data[resolve] = block;
      return req.scheme.render(template, view, req.page._renderPageResponse.bind(this, req, res));
    });
  } else {
    return req.scheme.render(template, view, req.page._renderPageResponse.bind(this, req, res));
  }
}

function basicViewWithJsonView(section, template, resolve, req, res, next) {
  res.format({
    'application/json': function() {
      var view = req.entity.view();
      if (view.data.hasOwnProperty('secrets')) {
        view.data.secrets = null;
      }
      if (resolve) {
        textblocks.resolvePragmaBlocks(view.data[resolve], resolve,
          doPragmaBlocks.bind(this, req, view), function(err, block) {
          if (err) {
            return next(err);
          }
          view.data[resolve] = block;
          res.json(view);
          res.end();
        });
      } else {
        res.json(view);
        res.end();
      }
    },
    'text/html': function() {
      basicView(section, template, resolve, req, res, next);
    },
  });
}

function DeletableMixin(page) {
  page.commandRouter.routeAll('delete.html', authorize({requiresAuth: true, permission: "delete"}));

  page.commandRouter.get('delete.html', function(req, res, next) {
    if (req.query.sure === 'yes') {
      req.flash('info', 'Page deleted');
      update.deleteEntity(req.db, req.ctx, req.access, req.entity, true, 'delete', next);
    } else {
      req.flash('error', 'Page not deleted');
      next();
    }
  });
  page.viewRouter.routeAll('delete.html', function(req, res, next) {
    return res.redirect(req.site.sitePathToUrl(req.sitepath.up()));
  });
}

function BaseBehaviorMixin(page) {
  page.commandRouter.routeAll('edit.html', authorize({requiresAuth: true, permission: 'edit'}));
  page.commandRouter.routeAll('publish.html', authorize({requiresAuth: true, permission: 'edit'}));
  page.commandRouter.routeAll('create.html', authorize({requiresAuth: true, effectivePermission: 'edit'}));
  page.commandRouter.routeAll('tag.html', authorize({requiresAuth: true, effectivePermission: 'edit'}));

  page.commandRouter.post('tag.html', function(req, res, next) {
    var oldent = req.entity.clone();
    var objKey;
    if (req.body.action === "addtag") {
      objKey = validator.stripLow(req.body.objKey);
      req.entity.addTag(null, objKey);
      update.updateEntity(req.db, req.ctx, req.access, oldent, req.entity, true, 'test', next);
    } else if (req.body.action === "rmtag") {
      objKey = validator.stripLow(req.body.objKey);
      req.entity.removeTag(null, objKey);
      update.updateEntity(req.db, req.ctx, req.access, oldent, req.entity, true, 'test', next);
    } else if (req.body.action === "navbar") {
      req.entity.addTag("navigation", "navbar");
      update.updateEntity(req.db, req.ctx, req.access, oldent, req.entity, true, 'test', next);
    } else {
      return logging.logAndCreateError(boundLogger, 'tag.html bad action',
            'page.validation', {
            ctx: req.ctx,
            msg: "invalid tagging action"
          }, next);
    }
  });

  page.commandRouter.post('edit.html', function(req, res, next) {
    var pageForm = new PageForm(true);
    pageForm.checkForm(req.body, function(err) {
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
        var saveAsDraft = validator.toBoolean(req.body.saveAsDraft);
        var oldent = req.entity.clone();
        req.entity.data.posting = textblocks.validateTextBlock(req.body.posting);
        req.entity.summary.title = req.body.title;
        req.entity.summary.abstract = req.body.abstract;
        req.entity.updateTimes(new Date());
        update.updateEntity(req.db, req.ctx, req.access, oldent, req.entity, !saveAsDraft, 'test', next);
      }
    });
  });

  page.commandRouter.get('create.html', function(req, res, next) {
    var now = new Date();
    req.entity.createNew(req.sitepath.down(req.body.path), req.page.proto, now);
    req.entity.data.posting = textblocks.makeTextBlock('', 'html');
    next();
  });

  page.commandRouter.post('publish.html', function(req, res, next) {
    var now = new Date();
    var revisionId = req.body.revisionId;
    if (validator.isUUID(revisionId)) {
      update.commitEntityRev(req.db, req.ctx, revisionId,
        function(err, entityId, revisionId, revisionNum) {
          if (err) {
            return next(err);
          }
          req.flash('info', 'Revision published');
          return res.redirect(req.site.sitePathToUrl(req.entity.path()));
        });
    } else {
      return logging.logAndCreateError(boundLogger, 'authorize not allowed',
        'page.validation.bad_revision_id', {
        ctx: req.ctx,
        revisionId: revisionId
      }, next);
    }
  });

  page.commandRouter.post('create.html', function(req, res, next) {
    var now = new Date();

    var pageForm = new PageForm(false);
    pageForm.checkForm(req.body, function(err) {
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
        var saveAsDraft = validator.toBoolean(req.body.saveAsDraft);
        if (validator.toBoolean(req.body.autogenSlug)) {
          var slug = toSlug(req.body.title);
          req.entity.createNew(req.sitepath.down(slug), req.page.proto, now);
        } else {
          req.entity.createNew(req.sitepath.down(req.body.leaf), req.page.proto, now);
        }
        req.entity.data.posting = textblocks.validateTextBlock(req.body.posting);
        req.entity.summary.title = req.body.title;
        req.entity.summary.abstract = req.body.abstract;
        update.createEntity(req.db, req.ctx, req.access, req.entity, !saveAsDraft, 'test',
        function(err, entityId, revisionId, revisionNum) {
          if (err) {
            return next(err);
          } else {
            return res.redirect(req.site.sitePathToUrl(req.entity.path()));
          }
        });
      }
    });
  });

  page.viewRouter.get('tag.cgi', function(req, res, next) {
    res.format({
      'application/json': function() {
        var view = req.entity.view();
        var data = {
          tags: view.tags,
        };
        res.json(data);
        res.end();
      }
    });
  });

  page.viewRouter.get('allowedtags.cgi', function(req, res, next) {
    res.format({
      'application/json': function() {
        var view = req.entity.view();
        var data = {
          autocomplete: null,
          predicates: [
            {
              id: 'dc:subject',
              name: 'Dublin Core: Subject',
              metadataClass: 'Dublin Core'},
            {
              id: 'dc:creator',
              name: 'Dublin Core: Creator',
              metadataClass: 'Dublin Core'},
            {
              id: 'dc:coverage',
              name: 'Dublin Core: Coverage',
              metadataClass: 'Dublin Core'},
            {
              id: 'pony',
              name: 'OMG Ponies',
              metadataClass: 'Ponies'},
          ]
        };
        res.json(data);
        res.end();
      }
    });
  });

  page.viewRouter.routeAll('edit.html', function(req, res, next) {
    var editData = {
      path: req.sitepath.toDottedPath(),
      title: req.entity.summary.title,
      abstract: req.entity.summary.abstract,
      block: req.entity.data.posting
    };
    res.expose(editData, 'formData');
    next();
  });

  page.viewRouter.routeAll('create.html', function(req, res, next) {
    var editData = {
      path: req.sitepath.toDottedPath(),
    };
    res.expose(editData, 'formData');
    next();
  });

  page.viewRouter.routeAll('edit.html', basicView.bind(this, 'edit', 'edit', null));
  page.viewRouter.routeAll('create.html', basicView.bind(this, 'create', 'create', null));
  page.viewRouter.routeAll('tag.html', basicView.bind(this, 'tag', 'tag', null));
}

function TagSearchViewMixin(page) {
  page.viewRouter.routeAll('tags.html', basicView.bind(this, 'tags', 'tags', null));
}

function HistoryViewMixin(page) {
  page.viewRouter.get('history.cgi', function(req, res, next) {
    res.format({
      'application/activity+json': function() {
        ActivityFeed.renderDirectJsonPayload(query, req.db, req.ctx,
          req.security, req.sitepath, req.site, req.revisionId, req.entity.permissions, function(err, data) {
            if (err) {
              return res.status(500).end();
            }
            res.json(data);
            res.end();
          });
      },
      'text/html': function() {
        basicView('history', 'history', null, req, res, next);
      },
    });
  });
}

function BasePage() {
  Page.call(this);
  this.proto = 'base';
  DeletableMixin(this);
  BaseBehaviorMixin(this);
  HistoryViewMixin(this);
  TagSearchViewMixin(this);

  this.viewRouter.get('', basicViewWithJsonView.bind(this, undefined, 'view', null));
}

util.inherits(BasePage, Page);

function CommentPage() {
  Page.call(this);
  this.proto = 'comment';
  DeletableMixin(this);
  BaseBehaviorMixin(this);
  HistoryViewMixin(this);
  TagSearchViewMixin(this);

  this.viewRouter.get('', basicViewWithJsonView.bind(this, undefined, 'view-comment', null));
}

util.inherits(CommentPage, Page);

function BlogPage() {
  Page.call(this);
  this.proto = 'blog';
  DeletableMixin(this);
  BaseBehaviorMixin(this);
  HistoryViewMixin(this);
  TagSearchViewMixin(this);

  this.viewRouter.get('', basicViewWithJsonView.bind(this, undefined, 'view-blog', null));

  this.viewRouter.post('comment.cgi', csrfProtection);

  this.commandRouter.routeAll('comment.cgi', authorize({requiresAuth: true, effectivePermission: 'comment'}));
  this.commandRouter.routeAll('comment.js', authorize({requiresAuth: true, effectivePermission: 'comment'}));

  this.viewRouter.get('comment.js', csrfProtection);
  this.viewRouter.get('comment.js', function(req, res, next) {
    res.set('Cache-Control', 'no-cache');
    res.format({
      'text/javascript': function() {
        res.write('(function (root) {root.csrfToken = "' +
          req.csrfToken() + '";root.commentPath = "' +
          req.site.sitePathToUrl(req.sitepath) + 'comment.cgi' +
          '";}(this));');
        res.end();
      },
    });
  });

  this.commandRouter.post('comment.cgi', function(req, res, next) {
    res.format({
      'application/json': function() {
        var commentPath = uuid.v1().replace(/-/g,'_');
        var now = new Date();

        var comment = new req.Entity();
        var encodedSrc = xssFilters.inHTMLData(req.body.comment);
        var commentText = '<p>' + encodedSrc.replace('\n\n', '</p>\n<p>') + '</p>';

        comment.createNew(req.sitepath.down(commentPath), 'comment', now);
        comment.summary.title = 'Comment';
        comment.summary.abstract = downsize(commentText,{"characters": 12, round:true});
        comment.data.comment = commentText;
        comment.summary.author = req.user.path().toDottedPath();
        comment.addTag("navigation", "comment");

        var canPost = req.entity.permissions.hasOwnProperty('comment');

        update.createEntity(req.db, req.ctx, req.access, comment, canPost, 'comment',
          function(err, entityId, revisionId, revisionNum) {
            if (err) {
              return next(err);
            } else {
              req.flash('info', 'Comment posted');
              res.status(202);
              if (canPost) {
                res.json({posted:true});
              } else {
                res.json({moderated:true});
              }
              return res.end();
            }
          });
      }
    });
  });
}

util.inherits(BlogPage, Page);

function TempIndexClass() {
  Page.call(this);
  this.proto = 'index';
  DeletableMixin(this);
  BaseBehaviorMixin(this);
  HistoryViewMixin(this);
  TagSearchViewMixin(this);

  this.viewRouter.get('', basicViewWithJsonView.bind(this, undefined, 'index', 'posting'));
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
  TagSearchViewMixin(this);

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

    req.entity.updateTimes(new Date());
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
        basicView('drafts', 'drafts', null, req, res, next);
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

  this.viewRouter.get('', basicViewWithJsonView.bind(this, undefined, 'view-user', null));
  this.viewRouter.get('grant.html', basicView.bind(this, undefined, 'view-user', null));
  this.viewRouter.routeAll('edit.html', basicView.bind(this, 'edit', 'edit-user', null));
  this.viewRouter.routeAll('create.html', basicView.bind(this, 'create', 'edit-user', null));
}

util.inherits(UserPage, Page);

var Protoset = function() {
  this._pages = {};
  this._metadata = {};
  this._listingDecorator = {};
  this.addProto('base', new BasePage(), {desc: 'PROTO_BASE'});
  this.addProto('blog', new BlogPage(), {desc: 'PROTO_BLOG'});
  this.addProto('comment', new CommentPage(), {desc: 'PROTO_COMMENT'});
  this.addProto('index', new TempIndexClass(), {desc: 'PROTO_INDEX', icon: 'folder'});
  this.addProto('user', new UserPage(), {desc: 'PROTO_USER'});
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
