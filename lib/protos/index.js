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
    if (req.entity.summary.identity.url) {
      res.serverVars.author = '<a href="' + req.entity.summary.identity.url + '">' +
        req.entity.summary.identity.name + "</a>";
    } else {
      res.serverVars.author = req.entity.summary.identity.name;
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

function BlogPage() {
  Page.call(this);
  this.proto = 'blog';

  this.preCreate = preCreate;

  mixins.DeletableMixin(this);
  mixins.BaseBehaviorMixin(this);
  mixins.HistoryViewMixin(this);
  mixins.TagSearchViewMixin(this);
  mixins.CommentableMixin(this);

  this.viewRouter.get('', view.basicViewWithJsonView.bind(this, undefined, 'view-blog'));
}

util.inherits(BlogPage, Page);

exports.BasePage = BasePage;
exports.CommentPage = CommentPage;
exports.IndexClass = IndexClass;
exports.MetaIndexPage = MetaIndexPage;
exports.BlogPage = BlogPage;
exports.PredicatePage = require('./predicate');
exports.VectorGraphicPage = require('./vectorgraphic');
exports.PhotoPage = require('./photo');
exports.UserPage = require('./user');
exports.LinkPage = require('./link');
exports.EmailFormPage = require('./emailform');
exports.AudioPage = require('./audio');
