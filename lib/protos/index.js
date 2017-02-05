var Page = require('../page'),
    mixins = require('../mixins'),
    textblocks = require('textblocks'),
    view = require('../view'),
    update = require ('../update'),
    util = require("util"),
    csurf = require('csurf'),
    authorize = require('../authorize'),
    logging = require('../logging'),
    validator = require('validator'),
    downsize = require('downsize'),
    toSlug = require('../toslug'),
    states = require('../states');

var boundLogger = logging.getRootLogger('protos');

function preCreate(entity) {
  entity.fullTextString = textblocks.extractTextBlockText(entity.data.posting);
}

function BasePage() {
  Page.call(this);
  this.proto = 'base';

  this.preCreate = preCreate;

  mixins.DeletableMixin(this);
  mixins.BaseBehaviorMixin(this);
  mixins.HistoryViewMixin(this);
  mixins.TagSearchViewMixin(this);

  this.viewRouter.get('', view.basicViewWithJsonView.bind(this, undefined, 'view'));
}

util.inherits(BasePage, Page);

function CommentPage() {
  Page.call(this);
  this.proto = 'comment';

  this.preCreate = function preCreate(entity) {
    entity.fullTextString = entity.data.comment;
  };

  mixins.DeletableMixin(this);
  mixins.BaseBehaviorMixin(this);
  mixins.HistoryViewMixin(this);
  mixins.TagSearchViewMixin(this);

  this.securityRouter.post('moderate.cgi', authorize({permission: 'comment.create'}));

  this.commandRouter.post('moderate.cgi', function(req, res, next) {
    var workflow = req.entity.curLogRev.workflow;
    workflow.needsReview = !(req.entity.permissions.hasOwnProperty('comment.create'));
    states.publishWorkflow.approve(workflow);

    var now = new Date();
    var revisionId = req.body.revisionId;
    if (validator.isUUID(revisionId)) {
      update.updateWorkflow(req.db, req.ctx, revisionId, workflow,
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

  this.viewRouter.get('', function(req, res, next) {
    if (req.entity.summary.identity) {
      if (req.entity.summary.identity.url) {
        res.serverVars.author = '<a href="' + req.entity.summary.identity.url + '">' +
          req.entity.summary.identity.name + "</a>";
      } else {
        res.serverVars.author = req.entity.summary.identity.name;
      }
    } else {
      res.serverVars.author = req.entity.summary.author;
    }
    next();
  });

  this.viewRouter.get('', view.basicViewWithJsonView.bind(this, undefined, 'view-comment'));
}

util.inherits(CommentPage, Page);

function IndexClass() {
  Page.call(this);
  this.proto = 'index';

  this.preCreate = preCreate;

  mixins.DeletableMixin(this);
  mixins.BaseBehaviorMixin(this);
  mixins.HistoryViewMixin(this);
  mixins.TagSearchViewMixin(this);

  this.viewRouter.get('', view.basicViewWithJsonView.bind(this, undefined, 'index'));
}

util.inherits(IndexClass, Page);

function MetaIndexPage() {
  Page.call(this);
  this.proto = 'metaindex';

  this.preCreate = preCreate;

  mixins.DeletableMixin(this);
  mixins.BaseBehaviorMixin(this);
  mixins.HistoryViewMixin(this);
  mixins.TagSearchViewMixin(this);

  this.viewRouter.get('', view.basicViewWithJsonView.bind(this, undefined, 'index'));
}

util.inherits(MetaIndexPage, Page);

function BlogIndexPage() {
  Page.call(this);
  this.proto = 'blogindex';

  this.preCreate = preCreate;

  mixins.DeletableMixin(this);
  mixins.BaseBehaviorMixin(this);
  mixins.HistoryViewMixin(this);
  mixins.TagSearchViewMixin(this);

  this.securityRouter.post('quickcreate.html', authorize({permission: 'edit'}));

  this.commandRouter.post('quickcreate.html', function(req, res, next) {
    var now = new Date();
    var post = new req.Entity();
    var slug = toSlug(req.body.title);
    post.createNew(req.sitepath.down(slug), 'blog', now);
    post.summary.title = req.body.title;
    post.data.posting = textblocks.makeTextBlock(req.body.posting, 'markdown', {site: req.site});
    post.summary.abstract = downsize(textblocks.extractTextBlockText(post.data.posting),{"characters": 100, round:true});
    post.summary.abstract = post.summary.abstract.replace('\n', '<br />');
    console.log(post);
    update.createEntity(req.db, req.ctx, req.access, post, true, '',
      function(err, entityId, revisionId, revisionNum) {
        if (err) {
          return next(err);
        } else {
          return res.redirect(req.site.sitePathToUrl(post.path()));
        }
      });
  });

  this.viewRouter.get('', view.basicViewWithJsonView.bind(this, undefined, 'view-blogindex'));
}

util.inherits(BlogIndexPage, Page);

function ImageIndexPage() {
  Page.call(this);
  this.proto = 'imageindex';

  this.preCreate = preCreate;

  mixins.DeletableMixin(this);
  mixins.BaseBehaviorMixin(this);
  mixins.HistoryViewMixin(this);
  mixins.TagSearchViewMixin(this);

  this.viewRouter.get('', view.basicViewWithJsonView.bind(this, undefined, 'view-imageindex'));
}

util.inherits(ImageIndexPage, Page);

exports.BasePage = BasePage;
exports.CommentPage = CommentPage;
exports.IndexClass = IndexClass;
exports.MetaIndexPage = MetaIndexPage;
exports.BlogIndexPage = BlogIndexPage;
exports.ImageIndexPage = ImageIndexPage;
exports.BlogPage = require('./blog').BlogPage;
exports.BlogSidebarPage = require('./blog').BlogSidebarPage;
exports.PredicatePage = require('./predicate');
exports.OntagPage = require('./ontag');
exports.VectorGraphicPage = require('./vectorgraphic');
exports.PhotoPage = require('./photo');
exports.UserPage = require('./user');
exports.LinkPage = require('./link');
exports.EmailFormPage = require('./emailform');
exports.AudioPage = require('./audio');
