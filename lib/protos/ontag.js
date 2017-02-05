var Page = require('../page');
var mixins = require('../mixins');
var view = require('../view');
var util = require("util");
var OntagForm = require('../forms/ontag.js');
var update = require ('../update'),
    validator = require('validator'),
    sanitize = require('../sanitize'),
    toSlug = require('../toslug'),
    formlib = require('../formlib');

function OntagPage() {
  Page.call(this);
  this.proto = 'ontag';
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
    formlib.copyViaDottedPath(req.entity, req.body, OntagForm.entityToForm);
    req.entity.summary.abstract = sanitize.sanitizeXML(req.body.abstract);
    req.entity.addTag("navigation", "ontag");
    req.entity.data.properties = req.body.properties;
    update.createEntity(req.db, req.ctx, req.access, req.entity, !saveAsDraft, req.body.memo,
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
    var minorChange = validator.toBoolean(req.body.minorChange);
    var sameRevision = false;
    if (req.entity.curLogRev) {
      var isDraft = !req.entity.curLogRev.evtFinal;
      if (isDraft && saveAsDraft) {
        sameRevision = !validator.toBoolean(req.body.createNewDraft);
      }
    }
    formlib.copyViaDottedPath(req.entity, req.body, OntagForm.entityToForm);
    req.entity.data.properties = req.body.properties;
    req.entity.summary.abstract = sanitize.sanitizeXML(req.body.abstract);
    if (minorChange) {
      req.entity.updateTouched(now);
    } else {
      req.entity.updateTimes(now);
    }
    update.updateEntity(req.db, req.ctx, req.access, oldent, req.entity, !saveAsDraft, sameRevision, req.body.memo, next);
  };

  this.exposeFunc = function(editData, req, res, next) {
    formlib.copyViaDottedPath(editData, req.entity, OntagForm.formToEntity);
    res.serverVars.bundle = "bundles/ontag.js";
    res.serverVars.component = "ontag.jsx";
    res.serverVars.formData = editData;
    next(null, editData);
  };

  this.exposeCreateFunc = function(editData, req, res, next) {
    res.serverVars.bundle = "bundles/ontag.js";
    res.serverVars.component = "ontag.jsx";
    next(null, editData);
  };

  this.validateForm = function(update, body, next) {
    var predicateForm = new OntagForm(update);
    predicateForm.checkForm(body, next);
  };

  mixins.DeletableMixin(this);
  mixins.BaseBehaviorMixin(this);
  mixins.HistoryViewMixin(this);
  mixins.TagSearchViewMixin(this);

  this.viewRouter.get('', view.basicViewWithJsonView.bind(this, undefined, 'view-ontag'));
}

util.inherits(OntagPage, Page);

module.exports = OntagPage;
