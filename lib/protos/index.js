var Page = require('../page');
var mixins = require('../mixins');
var view = require('../view');
var util = require("util");
var csurf = require('csurf');
var authorize = require('../authorize');

function BasePage() {
  Page.call(this);
  this.proto = 'base';
  mixins.DeletableMixin(this);
  mixins.BaseBehaviorMixin(this);
  mixins.HistoryViewMixin(this);
  mixins.TagSearchViewMixin(this);

  this.viewRouter.get('', view.basicViewWithJsonView.bind(this, undefined, 'view', null));
}

util.inherits(BasePage, Page);

function CommentPage() {
  Page.call(this);
  this.proto = 'comment';
  mixins.DeletableMixin(this);
  mixins.BaseBehaviorMixin(this);
  mixins.HistoryViewMixin(this);
  mixins.TagSearchViewMixin(this);

  this.viewRouter.get('', view.basicViewWithJsonView.bind(this, undefined, 'view-comment', null));
}

util.inherits(CommentPage, Page);

function TempIndexClass() {
  Page.call(this);
  this.proto = 'index';
  mixins.DeletableMixin(this);
  mixins.BaseBehaviorMixin(this);
  mixins.HistoryViewMixin(this);
  mixins.TagSearchViewMixin(this);

  this.viewRouter.get('', view.basicViewWithJsonView.bind(this, undefined, 'index', 'posting'));
}

util.inherits(TempIndexClass, Page);

function MetaIndexPage() {
  Page.call(this);
  this.proto = 'meta';
  mixins.DeletableMixin(this);
  mixins.BaseBehaviorMixin(this);
  mixins.HistoryViewMixin(this);
  mixins.TagSearchViewMixin(this);

  this.viewRouter.get('', view.basicViewWithJsonView.bind(this, undefined, 'index', 'posting'));
}

util.inherits(MetaIndexPage, Page);

function BlogPage() {
  Page.call(this);
  this.proto = 'blog';
  mixins.DeletableMixin(this);
  mixins.BaseBehaviorMixin(this);
  mixins.HistoryViewMixin(this);
  mixins.TagSearchViewMixin(this);
  mixins.CommentableMixin(this);

  this.viewRouter.get('', view.basicViewWithJsonView.bind(this, undefined, 'view-blog', null));
}

util.inherits(BlogPage, Page);

exports.BasePage = BasePage;
exports.CommentPage = CommentPage;
exports.TempIndexClass = TempIndexClass;
exports.MetaIndexPage = MetaIndexPage;
exports.BlogPage = BlogPage;
