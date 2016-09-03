var update = require ('../update'),
    logging = require('../logging'),
    authorize = require('../authorize'),
    ActivityFeed = require('../activityfeed'),
    PageForm = require('../forms/page.js'),
    view = require('../view'),
    query = require('../query'),
    csurf = require('csurf'),
    Conf = require('../conf'),
    uuid = require('node-uuid'),
    validator = require('validator'),
    xssFilters = require('xss-filters'),
    downsize = require('downsize');

var boundLogger = logging.getRootLogger('mixins.index');

function DeletableMixin(page) {
  page.securityRouter.get('delete.html', authorize({requiresAuth: true, permission: "delete"}));

  page.freshnessRouter.get('delete.html', view.noCacheView);

  page.commandRouter.get('delete.html', function(req, res, next) {
    if (req.query.sure === 'yes') {
      req.flash('info', 'Page deleted');
      update.deleteEntity(req.db, req.ctx, req.access, req.entity, true, 'delete', next);
    } else {
      req.flash('error', 'Page not deleted');
      next();
    }
  });
  page.viewRouter.get('delete.html', function(req, res, next) {
    return res.redirect(req.site.sitePathToUrl(req.sitepath.up()));
  });
}

function TagSearchViewMixin(page) {
  page.securityRouter.get('search.cgi', authorize({permission: 'view'}));
  page.securityRouter.post('search.cgi', authorize({permission: 'view'}));

  page.viewRouter.post('search.cgi', function(req, res, next) {
    res.serverVars.search = req.body.search;
    next();
  });
  page.viewRouter.routeAll('search.cgi', view.basicView.bind(this, 'search', 'search'));
}

function HistoryViewMixin(page) {
  page.securityRouter.routeAll('history.cgi', authorize({permission: 'history'}));
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
        view.basicView('history', 'history', req, res, next);
      }
    });
  });
}

var csrfProtection = csurf();

function CommentableMixin(page) {
  page.securityRouter.post('comment.cgi', csrfProtection);
  page.securityRouter.get('comment.cgi', authorize({effectivePermission: 'comment'}));
  page.securityRouter.post('comment.cgi', authorize({effectivePermission: 'comment'}));
  page.securityRouter.get('comment.js', authorize({effectivePermission: 'comment'}));

  page.freshnessRouter.routeAll('comment.js', view.noCacheView);

  page.commandRouter.get('comment.js', function(req, res, next) {
    req.rateLimiter.csrfLimiter(req.ipAddress, function(err, timeLeft) {
      if (err) {
        return res.status(500).send();
      } else if (timeLeft) {
        return res.status(429).send("You must wait " + timeLeft + " ms before you can make requests.");
      } else {
        return next();
      }
    });
  });

  page.viewRouter.get('comment.js', csrfProtection);
  page.viewRouter.get('comment.js', function(req, res, next) {
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
    req.rateLimiter.ipLimiter(req.ipAddress, function(err, timeLeft) {
      if (err) {
        return res.status(500).send();
      } else if (timeLeft) {
        return res.status(429).send("You must wait " + timeLeft + " ms before you can make requests.");
      } else {
        return next();
      }
    });
  });

  page.commandRouter.post('comment.cgi', function(req, res, next) {
    if (!req.user) {
      return next();
    }
    req.rateLimiter.userLimiter(req.user.user.path().toDottedPath(), function(err, timeLeft) {
      if (err) {
        return res.status(500).send();
      } else if (timeLeft) {
        return res.status(429).send("You must wait " + timeLeft + " ms before you can make requests.");
      } else {
        return next();
      }
    });
  });

  page.commandRouter.post('comment.cgi', function(req, res, next) {
    res.format({
      'application/json': function() {
        var commentPath = uuid.v1().replace(/-/g,'_');
        var now = new Date();

        if (!req.body.comment) {
          return logging.logAndCreateError(boundLogger, 'comment.cgi no body',
            'page.validation', {
              ctx: req.ctx,
              msg: "body is required"
            }, next);
        }

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
          comment.summary.identity = {ip: req.ip};
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
