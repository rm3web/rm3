var Page = require('../page');
var mixins = require('../mixins');
var view = require('../view');
var util = require("util");
var LinkForm = require('../forms/link.js');
var update = require ('../update'),
    validator = require('validator'),
    toSlug = require('../toslug');

function LinkPage() {
  Page.call(this);
  this.proto = 'link';
  this.editTemplate = 'edit';
  this.createTemplate = 'edit';

  this.createFunc = function(now, req, res, next) {
    var saveAsDraft = validator.toBoolean(req.body.saveAsDraft);
    if (validator.toBoolean(req.body.autogenSlug)) {
      var slug = toSlug(req.body.title);
      req.entity.createNew(req.sitepath.down(slug), req.page.proto, now);
    } else {
      req.entity.createNew(req.sitepath.down(req.body.leaf), req.page.proto, now);
    }
    req.entity.summary.title = req.body.title;
    req.entity.summary.abstract = req.body.abstract;
    req.entity.summary.url = req.body.url;
    update.createEntity(req.db, req.ctx, req.access, req.entity, !saveAsDraft, 'test',
    function(err, entityId, revisionId, revisionNum) {
      if (err) {
        return next(err);
      } else {
        return res.redirect(req.site.sitePathToUrl(req.entity.path()));
      }
    });
  };

  this.editFunc = function(oldent, now, req, res, next) {
    var saveAsDraft = validator.toBoolean(req.body.saveAsDraft);
    var sameRevision = false;
    if (req.entity.curLogRev) {
      var isDraft = !req.entity.curLogRev.evtFinal;
      if (isDraft && saveAsDraft) {
        sameRevision = !validator.toBoolean(req.body.createNewDraft);
      }
    }
    req.entity.summary.title = req.body.title;
    req.entity.summary.abstract = req.body.abstract;
    req.entity.summary.url = req.body.url;
    req.entity.updateTimes(now);
    update.updateEntity(req.db, req.ctx, req.access, oldent, req.entity, !saveAsDraft, sameRevision, 'test', next);
  };

  this.exposeFunc = function(req, res, next) {
    var editData = {
      path: req.sitepath.toDottedPath(),
      title: req.entity.summary.title,
      abstract: req.entity.summary.abstract,
      url: req.entity.summary.url
    };
    res.expose(editData, 'formData');
    res.expose({}, 'errors');
    res.serverVars.bundle = "bundles/link.js";
    res.serverVars.component = "link.jsx";
    res.serverVars.formData = editData;
    next();
  };

  this.exposeCreateFunc = function(req, res, next) {
    res.serverVars.bundle = "bundles/link.js";
    res.serverVars.component = "link.jsx";
    next();
  };

  this.validateForm = function(update, body, next) {
    var linkForm = new LinkForm(update);
    linkForm.checkForm(body, next);
  };

  mixins.DeletableMixin(this);
  mixins.BaseBehaviorMixin(this);
  mixins.HistoryViewMixin(this);
  mixins.TagSearchViewMixin(this);

  this.viewRouter.get('', view.basicViewWithJsonView.bind(this, undefined, 'view-link'));
}

util.inherits(LinkPage, Page);

module.exports = LinkPage;
