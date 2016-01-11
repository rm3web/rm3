var update = require ('../update'),
    logging = require('../logging'),
    authorize = require('../authorize'),
    ActivityFeed = require('../activityfeed'),
    PageForm = require('../forms/page.js'),
    view = require('../view'),
    query = require('../query');
var csurf = require('csurf');
var uuid = require('node-uuid');
var xssFilters = require('xss-filters');
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
exports.BaseBehaviorMixin = require('./basebehavior');
exports.CommentableMixin = CommentableMixin;