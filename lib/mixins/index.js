var update = require ('../update'),
    logging = require('../logging'),
    authorize = require('../authorize'),
    ActivityFeed = require('../activityfeed'),
    PageForm = require('../forms/page.js'),
    view = require('../view'),
    query = require('../query');
var csurf = require('csurf');
var uuid = require('node-uuid');
var validator = require('validator'),
    xssFilters = require('xss-filters');
var downsize = require('downsize');

var boundLogger = logging.getRootLogger('mixins.index');

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
  page.commandRouter.routeAll('search.cgi', authorize({permission: 'view'}));
  page.viewRouter.routeAll('search.cgi', view.basicView.bind(this, 'search', 'search', null));
}

function HistoryViewMixin(page) {
  page.commandRouter.routeAll('history.cgi', authorize({permission: 'view'}));
  page.viewRouter.get('history.cgi', function(req, res, next) {
    res.format({
      'application/activity+json': function() {
        ActivityFeed.renderDirectJsonPayload(query, req.db, req.ctx,
          req.access, req.sitepath, req.site, req.revisionId, req.entity.permissions, function(err, data) {
            if (err) {
              return res.status(500).end();
            }
            res.json(data);
            res.end();
          });
      },
      'text/html': function() {
        view.basicView('history', 'history', null, req, res, next);
      }
    });
  });
}

var csrfProtection = csurf();

function CommentableMixin(page) {
  page.viewRouter.post('comment.cgi', csrfProtection);

  page.commandRouter.routeAll('comment.cgi', authorize({effectivePermission: 'comment'}));
  page.commandRouter.routeAll('comment.js', authorize({effectivePermission: 'comment'}));

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
      }
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
        if (req.user) {
          comment.summary.author = req.user.user.path().toDottedPath();
        } else {
          comment.summary.identity = {};
          if (req.body.name) {
            comment.summary.identity.name = xssFilters.inHTMLData(req.body.name);
          } else {
            return logging.logAndCreateError(boundLogger, 'comment.cgi no name',
              'page.validation', {
                ctx: req.ctx,
                msg: "name is required"
              }, next);
          }
          if (req.body.email) {
            if (validator.isEmail(req.body.email)) {
              comment.summary.identity.email = req.body.email;
            } else {
              return logging.logAndCreateError(boundLogger, 'comment.cgi no name',
                'page.validation', {
                  ctx: req.ctx,
                  msg: "url is malformed"
                }, next);
            }
          }
          if (req.body.url) {
            if (validator.isURL(req.body.url)) {
              comment.summary.identity.url = req.body.url;
            } else {
              return logging.logAndCreateError(boundLogger, 'comment.cgi no name',
                'page.validation', {
                  ctx: req.ctx,
                  msg: "url is malformed"
                }, next);
            }
          }
          req.access.identity = comment.summary.identity;
        }
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
exports.BaseBehaviorMixin = require('./basebehavior');
exports.CommentableMixin = CommentableMixin;
