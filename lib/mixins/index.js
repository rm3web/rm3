var update = require ('../update'),
    logging = require('../logging'),
    authorize = require('../authorize'),
    ActivityFeed = require('../activityfeed'),
    PageForm = require('../forms/page.js'),
    validator = require('validator'),
    textblocks = require('textblocks'),
    getSlug = require('speakingurl'),
    view = require('../view'),
    query = require('./query');
var csurf = require('csurf');
var uuid = require('node-uuid');
var xssFilters = require('xss-filters');
var downsize = require('downsize');
var update = require ('../update');

var boundLogger = logging.getRootLogger('mixins.index');

function toSlug(url) {
  return getSlug(url, {
    separator: '_',
    truncate: -48,
    custom: {
      '-': '_'
    }
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

function TagSearchViewMixin(page) {
  page.viewRouter.routeAll('tags.html', view.basicView.bind(this, 'tags', 'tags', null));
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
        view.basicView('history', 'history', null, req, res, next);
      },
    });
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
    var oldent = req.entity.clone();
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

  page.viewRouter.routeAll('edit.html', view.basicView.bind(this, 'edit', 'edit', null));
  page.viewRouter.routeAll('create.html', view.basicView.bind(this, 'create', 'create', null));
  page.viewRouter.routeAll('tag.html', view.basicView.bind(this, 'tag', 'tag', null));
}

var csrfProtection = csurf();

function CommentableMixin(page) {
  page.viewRouter.post('comment.cgi', csrfProtection);

  page.commandRouter.routeAll('comment.cgi', authorize({requiresAuth: true, effectivePermission: 'comment'}));
  page.commandRouter.routeAll('comment.js', authorize({requiresAuth: true, effectivePermission: 'comment'}));

  page.viewRouter.get('comment.js', csrfProtection);
  page.viewRouter.get('comment.js', function(req, res, next) {
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

  page.commandRouter.post('comment.cgi', function(req, res, next) {
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

exports.DeletableMixin = DeletableMixin;
exports.TagSearchViewMixin = TagSearchViewMixin;
exports.HistoryViewMixin = HistoryViewMixin;
exports.BaseBehaviorMixin = BaseBehaviorMixin;
exports.CommentableMixin = CommentableMixin;
