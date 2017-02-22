var util = require("util"),
    errs = require('errs'),
    validator = require('validator'),
    async = require('async'),
    logging = require('./logging'),
    i10n = require('./i10n'),
    SitePath = require ('sitepath'),
    authorize = require('./authorize'),
    protos = require('./protos'),
    xssFilters = require('xss-filters');

var boundLogger = logging.getRootLogger('protoset');

function ValidationError() {
  this.httpResponseCode = 400;
  this.message = "VALIDATION_ERROR";
  Error.call(this);
}
util.inherits(ValidationError, Error);
i10n.intlErrorMixin(ValidationError);
errs.register('page.validation', ValidationError);

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

var Protoset = function() {
  this._pages = {};
  this._metadata = {};
  this._listingDecorator = {};
  this.addProto('base', new protos.BasePage(), {desc: 'PROTO_BASE'});
  this.addProto('blog', new protos.BlogPage(), {desc: 'PROTO_BLOG'});
  this.addProto('blogsidebar', new protos.BlogSidebarPage(), {desc: 'PROTO_BLOG_SIDEBAR'});
  this.addProto('comment', new protos.CommentPage(), {desc: 'PROTO_COMMENT', icon: 'reply'});
  this.addProto('index', new protos.IndexClass(), {desc: 'PROTO_INDEX', icon: 'folder'});
  this.addProto('user', new protos.UserPage(), {desc: 'PROTO_USER'});
  this.addProto('metaindex', new protos.MetaIndexPage(), {desc: 'PROTO_META', icon: 'folder'});
  this.addProto('blogindex', new protos.BlogIndexPage(), {desc: 'PROTO_BLOG_INDEX', icon: 'folder'});
  this.addProto('imageindex', new protos.ImageIndexPage(), {desc: 'PROTO_IMAGE_INDEX', icon: 'folder'});
  this.addProto('predicate', new protos.PredicatePage(), {desc: 'PROTO_PREDICATE', icon: 'tag'});
  this.addProto('ontag', new protos.OntagPage(), {desc: 'PROTO_ONTAG', icon: 'tag'});
  this.addProto('vectorgraphic', new protos.VectorGraphicPage(), {desc: 'PROTO_VECTORGRAPHIC'});
  this.addProto('photo', new protos.PhotoPage(), {desc: 'PROTO_PHOTO'});
  this.addProto('link', new protos.LinkPage(), {desc: 'PROTO_LINK', icon: 'bookmark'});
  this.addProto('emailform', new protos.EmailFormPage(), {desc: 'PROTO_EMAILFORM'});
  this.addProto('audio', new protos.AudioPage(), {desc: 'PROTO_AUDIO', icon: 'audio'});
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

Protoset.prototype.generateFigure = function(ctx, blobstores, site, entity, options, next) {
  var figSize = options['data-size'];
  var figFloat = options['data-float'];
  var title = options['data-title'];
  var desc = options['data-desc'];
  var url = site.sitePathToUrl(entity.path());
  var caption = '';
  if (!title) {
    title = entity.summary.title;
  }
  if (title || desc) {
    if (!desc) {
      desc = '';
    }
    caption = '<figcaption><h3><a href="' + xssFilters.uriInDoubleQuotedAttr(url) +
      '">' + xssFilters.inHTMLData(title) + '</a></h3>'  +
      xssFilters.inHTMLData(desc) + '</figcaption>';
  }
  var floatStr = '';
  if (figFloat === 'left') {
    floatStr = ' style="float: left;" ';
  }
  if (figFloat === 'right') {
    floatStr = ' style="float: right;" ';
  }
  if (this._pages[entity._proto].hasOwnProperty('generateFigure')) {
    return this._pages[entity._proto].generateFigure(ctx, blobstores, entity, options, function(err, figcontents) {
      if (err) {
        return next(err);
      }
      return next(null, '<figure' + floatStr + '><a href="' + url + '">' +
        figcontents + "</a>" + caption + '</figure>');
    });
  } else {
    return next(null, '<figure' + floatStr + '>' + xssFilters.inHTMLData(entity.summary.title) + caption + '</figure>');
  }
};

Protoset.prototype.decorateListing = function(ctx, article, dbRow, scheme, site, blobstores, next) {
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
    } else if (dbRow.summary.identity) {
      article.meta['atom:author'] = {name: dbRow.summary.identity.name};
      if (dbRow.summary.identity.url) {
        article.meta['atom:author'].uri = dbRow.summary.identity.url;
      }
    }
  }
  if (tag === 'link') {
    article.meta['rm3:via'] = article.link;
    article.link = dbRow.summary.url;
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
  if (this._pages[tag] && this._pages[tag].hasOwnProperty('enhanceFunc')) {
    this._pages[tag].enhanceFunc(ctx, article, dbRow, scheme, site, blobstores, next);
  } else {
    next(null, article);
  }
};

module.exports = exports = new Protoset();
