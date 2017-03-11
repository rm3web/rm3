var Page = require('../page'),
    mixins = require('../mixins'),
    textblocks = require('textblocks'),
    view = require('../view'),
    update = require ('../update'),
    util = require("util"),
    csurf = require('csurf'),
    toSlug = require('../toslug'),
    formlib = require('../formlib'),
    authorize = require('../authorize'),
    logging = require('../logging'),
    sanitize = require('../sanitize'),
    validator = require('validator'),
    BlogSidebarForm = require('../forms/blog-sidebar.js'),
    states = require('../states');

function BlogPage() {
  Page.call(this);
  this.proto = 'blog';

  this.preCreate = function preCreate(entity) {
    entity.fullTextString = textblocks.extractTextBlockText(entity.data.posting);
  };

  mixins.DeletableMixin(this);
  mixins.BaseBehaviorMixin(this);
  mixins.HistoryViewMixin(this);
  mixins.TagSearchViewMixin(this);
  mixins.CommentableMixin(this);

  this.viewRouter.get('', view.basicViewWithJsonView.bind(this, undefined, 'view-blog'));
}

util.inherits(BlogPage, Page);

function BlogSidebarPage() {
  Page.call(this);
  this.proto = 'blogsidebar';

  this.preCreate = function preCreate(entity) {
    entity.fullTextString = textblocks.extractTextBlockText(entity.data.posting) + textblocks.extractTextBlockText(entity.data.sidebar);
  };

  this.createFunc = function(now, req, res, next) {
    var self = this;
    var saveAsDraft = validator.toBoolean(req.body.saveAsDraft);
    if (validator.toBoolean(req.body.autogenSlug)) {
      var slug = toSlug(req.body.title);
      req.entity.createNew(req.sitepath.down(slug), req.page.proto, now);
    } else {
      req.entity.createNew(req.sitepath.down(req.body.leaf), req.page.proto, now);
    }
    formlib.copyViaDottedPath(req.entity, req.body, BlogSidebarForm.entityToForm);
    req.entity.summary.abstract = sanitize.sanitizeXML(req.body.abstract);
    req.entity.data.posting = textblocks.validateTextBlock(req.body.posting, {site: req.site});
    req.entity.data.sidebar = textblocks.validateTextBlock(req.body.sidebar, {site: req.site});
    req.entity.fullTextString = textblocks.extractTextBlockText(req.entity.data.posting) + textblocks.extractTextBlockText(req.entity.data.sidebar);
    update.createEntity(req.db, req.ctx, req.access, req.entity, !saveAsDraft, req.body.memo,
    function(err, entityId, revisionId, revisionNum) {
      if (err) {
        return next(err);
      }
      return res.redirect(req.site.sitePathToUrl(req.entity.path()));
    });
  };

  this.editFunc = function(oldent, now, req, res, next) {
    var self = this;
    var saveAsDraft = validator.toBoolean(req.body.saveAsDraft);
    var minorChange = validator.toBoolean(req.body.minorChange);
    var sameRevision = false;
    if (req.entity.curLogRev) {
      var isDraft = !req.entity.curLogRev.evtFinal;
      if (isDraft && saveAsDraft) {
        sameRevision = !validator.toBoolean(req.body.createNewDraft);
      }
    }
    formlib.copyViaDottedPath(req.entity, req.body, BlogSidebarForm.entityToForm);
    req.entity.summary.abstract = sanitize.sanitizeXML(req.body.abstract);
    req.entity.data.posting = textblocks.validateTextBlock(req.body.posting, {site: req.site});
    req.entity.data.sidebar = textblocks.validateTextBlock(req.body.sidebar, {site: req.site});
    req.entity.fullTextString = textblocks.extractTextBlockText(req.entity.data.posting) + textblocks.extractTextBlockText(req.entity.data.sidebar);
    if (minorChange) {
      req.entity.updateTouched(now);
    } else {
      req.entity.updateTimes(now);
    }
    update.updateEntity(req.db, req.ctx, req.access, oldent, req.entity, !saveAsDraft, sameRevision, req.body.memo, function(err, entityId, revisionId, revisionNum) {
      if (err) {
        return next(err);
      }
      return res.redirect(req.site.sitePathToUrl(req.entity.path()));
    });
  };

  this.exposeFunc = function(editData, req, res, next) {
    formlib.copyViaDottedPath(editData, req.entity, BlogSidebarForm.formToEntity);
    res.serverVars.bundle = "bundles/blogsidebar.js";
    res.serverVars.component = "blogsidebar.jsx";
    res.serverVars.formData = editData;
    next(null, editData);
  };

  this.exposeCreateFunc = function(editData, req, res, next) {
    res.serverVars.bundle = "bundles/blogsidebar.js";
    res.serverVars.component = "blogsidebar.jsx";
    return next(null, editData);
  };

  mixins.DeletableMixin(this);
  mixins.BaseBehaviorMixin(this);
  mixins.HistoryViewMixin(this);
  mixins.TagSearchViewMixin(this);
  mixins.CommentableMixin(this);

  this.viewRouter.get('', view.basicViewWithJsonView.bind(this, undefined, 'view-blog-sidebar'));
}

util.inherits(BlogSidebarPage, Page);

exports.BlogPage = BlogPage;
exports.BlogSidebarPage = BlogSidebarPage;
