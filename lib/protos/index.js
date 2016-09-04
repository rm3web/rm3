var Page = require('../page'),
    mixins = require('../mixins'),
    textblocks = require('textblocks'),
    view = require('../view'),
    util = require("util"),
    csurf = require('csurf'),
    authorize = require('../authorize');

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
