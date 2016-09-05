var Page = require('../page');
var mixins = require('../mixins');
var view = require('../view');
var util = require("util");
var EmailForm = require('../forms/email.js');
var update = require ('../update'),
    validator = require('validator'),
    toSlug = require('../toslug'),
    formlib = require('../formlib');
var extract = require('meta-extractor');

function EmailFormPage() {
  Page.call(this);
  this.proto = 'emailform';
  this.editTemplate = 'edit';
  this.createTemplate = 'edit';

  this.preCreate = function preCreate(entity) {
    entity.fullTextString = entity.summary.abstract;
  };

  this.createFunc = function(now, req, res, next) {
    var saveAsDraft = validator.toBoolean(req.body.saveAsDraft);
    if (validator.toBoolean(req.body.autogenSlug)) {
      var slug = toSlug(req.body.title);
      req.entity.createNew(req.sitepath.down(slug), req.page.proto, now);
    } else {
      req.entity.createNew(req.sitepath.down(req.body.leaf), req.page.proto, now);
    }
    formlib.copyViaDottedPath(req.entity, req.body, EmailForm.entityToForm);
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
    formlib.copyViaDottedPath(req.entity, req.body, EmailForm.entityToForm);
    req.entity.updateTimes(now);
    update.updateEntity(req.db, req.ctx, req.access, oldent, req.entity, !saveAsDraft, sameRevision, 'test', next);
  };

  this.exposeFunc = function(editData, req, res, next) {
    formlib.copyViaDottedPath(editData, req.entity, EmailForm.formToEntity);
    res.serverVars.bundle = "bundles/email.js";
    res.serverVars.component = "email.jsx";
    res.serverVars.formData = editData;
    next(null, editData);
  };

  this.exposeCreateFunc = function(editData, req, res, next) {
    res.serverVars.bundle = "bundles/email.js";
    res.serverVars.component = "email.jsx";
    return next(null, editData);
  };

  this.validateForm = function(update, body, next) {
    var emailForm = new EmailForm(update);
    emailForm.checkForm(body, next);
  };

  mixins.DeletableMixin(this);
  mixins.BaseBehaviorMixin(this);
  mixins.HistoryViewMixin(this);
  mixins.TagSearchViewMixin(this);

  this.viewRouter.get('', view.basicViewWithJsonView.bind(this, undefined, 'send-email'));
}

util.inherits(EmailFormPage, Page);

module.exports = EmailFormPage;
