var Page = require('../page');
var mixins = require('../mixins');
var view = require('../view');
var util = require("util");
var VectorGraphicForm = require('../forms/vectorgraphic.js');
var update = require ('../update'),
    validator = require('validator'),
    toSlug = require('../toslug'),
    authorize = require('../authorize'),
    textblocks = require('textblocks'),
    sanitize = require('../sanitize'),
    formlib = require('../formlib'),
    decorators = require('../decorators');
var workflow = require('../workflow');
var async = require('async');
var multer  = require('multer');
var storage = multer.memoryStorage();
var upload = multer({storage: storage});

function AudioPage() {
  Page.call(this);
  this.proto = 'audio';
  this.editTemplate = 'edit';
  this.createTemplate = 'edit';

  this.commandRouter.routeAll('edit.html', upload.single('svg'));
  this.commandRouter.routeAll('create.html', upload.single('svg'));

  decorators.BlobViewDecorator(this, 'file.mp3', 'listen.mp3');

  this.exposeFunc = function(editData, req, res, next) {
    formlib.copyViaDottedPath(editData, req.entity, VectorGraphicForm.formToEntity);
    res.serverVars.bundle = "bundles/vectorgraphic.js";
    res.serverVars.component = "vectorgraphic.jsx";
    res.serverVars.formData = editData;
    next(null, editData);
  };

  this.exposeCreateFunc = function(editData, req, res, next) {
    res.serverVars.bundle = "bundles/vectorgraphic.js";
    res.serverVars.component = "vectorgraphic.jsx";
    next(null, editData);
  };

  this.createFunc = function(now, req, res, next) {
    var self = this;
    var blobstore = req.blobstores.getBlobStore('public');

    var saveAsDraft = validator.toBoolean(req.body.saveAsDraft);
    if (validator.toBoolean(req.body.autogenSlug)) {
      var slug = toSlug(req.body.title);
      req.entity.createNew(req.sitepath.down(slug), req.page.proto, now);
    } else {
      req.entity.createNew(req.sitepath.down(req.body.leaf), req.page.proto, now);
    }
    //var sizes = sizeOf(req.file.buffer);
    formlib.copyViaDottedPath(req.entity, req.body, VectorGraphicForm.entityToForm);
    //req.entity.summary.size = {width: sizes.width, height: sizes.height};
    var str = JSON.stringify(req.body.posting);
    req.entity.data.posting = textblocks.validateTextBlock(JSON.parse(str), {site: req.site});
    req.entity.summary.abstract = sanitize.sanitizeXML(req.body.abstract);

    update.createEntity(req.db, req.ctx, req.access, req.entity, !saveAsDraft, req.body.memo,
    function(err, entityId, revisionId, revisionNum) {
      if (err) {
        return next(err);
      }
      blobstore.addBlob(req.ctx, req.entity.path().toDottedPath(), 'file.mp3', revisionId, true, false, req.file.buffer, function(err) {
        if (err) {
          return next(err);
        }
        if (req.body.newResponse) {
          res.status(202);
          res.json({posted:true, location: req.site.sitePathToUrl(req.entity.path())});
          return res.end();
        } else {
          return res.redirect(req.site.sitePathToUrl(req.entity.path()));
        }
      });
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
    var oldRevisionId = req.entity._revisionId;
    var blobstore = req.blobstores.getBlobStore('public');
    formlib.copyViaDottedPath(req.entity, req.body, VectorGraphicForm.entityToForm);
    if (minorChange) {
      req.entity.updateTouched(now);
    } else {
      req.entity.updateTimes(now);
    }
    if (req.file) {
      //var sizes = sizeOf(req.file.buffer);
      //req.entity.summary.size = {width: sizes.width, height: sizes.height};
    }
    var str = JSON.stringify(req.body.posting);
    req.entity.data.posting = textblocks.validateTextBlock(JSON.parse(str), {site: req.site});
    req.entity.summary.abstract = sanitize.sanitizeXML(req.body.abstract);

    update.updateEntity(req.db, req.ctx, req.access, oldent, req.entity, !saveAsDraft, sameRevision, req.body.memo, function(err, entityId, revisionId, revisionNum) {
      if (err) {
        return next(err);
      }
      if (req.file) {
        blobstore.addBlob(req.ctx, req.entity.path().toDottedPath(), 'file.mp3', revisionId, true, false, req.file.buffer, function(err) {
          if (err) {
            return next(err);
          }
          if (req.body.newResponse) {
            res.status(202);
            res.json({posted:true, location: req.site.sitePathToUrl(req.entity.path())});
            return res.end();
          } else {
            return res.redirect(req.site.sitePathToUrl(req.entity.path()));
          }
        });
      } else {
        if (!sameRevision) {
          req.blobstores.batchAlias(req.ctx, blobstore, req.entity.path().toDottedPath(),
            ['file.mp3'],
            revisionId, true, false, oldRevisionId, function(err) {
              if (req.body.newResponse) {
                res.status(202);
                res.json({posted:true, location: req.site.sitePathToUrl(req.entity.path())});
                return res.end();
              } else {
                return next(err);
              }
            });
        } else {
          if (req.body.newResponse) {
            res.status(202);
            res.json({posted:true, location: req.site.sitePathToUrl(req.entity.path())});
            return res.end();
          } else {
            return res.redirect(req.site.sitePathToUrl(req.entity.path()));
          }
        }
      }
    });
  };

  this.postAlterFunc = function(revisionId, oldRevisionId, req, res, next) {
    var blobstore = req.blobstores.getBlobStore('public');
    req.blobstores.batchAlias(req.ctx, blobstore, req.entity.path().toDottedPath(),
      ['file.mp3'],
      revisionId, true, false, oldRevisionId, function(err) {
        next(err);
      });
  };

  this.validateForm = function(update, body, next) {
    var vectorGraphicForm = new VectorGraphicForm(update);
    vectorGraphicForm.checkForm(body, next);
  };

  mixins.DeletableMixin(this);
  mixins.BaseBehaviorMixin(this);
  mixins.HistoryViewMixin(this);
  mixins.TagSearchViewMixin(this);

  this.viewRouter.get('', function(req, res, next) {
    var blobstore = req.blobstores.getBlobStore('public');
    var blobNames = [{key: 'audio', filename: 'file.mp3'}];
    async.each(blobNames, function(param, cb) {
      req.blobstores.fetchBlob(req.ctx, blobstore, req.entity.path().toDottedPath(), param.filename, req.entity._revisionId, function(err, blobpath) {
        if (err) {
          return cb(err);
        }
        if (blobpath) {
          res.serverVars[param.key] = blobpath;
          res.expose(blobpath, 'audio');
        }
        cb();
      });
    },next);
  });

  this.viewRouter.get('', view.basicViewWithJsonView.bind(this, undefined, 'audio'));
}

util.inherits(AudioPage, Page);

module.exports = AudioPage;
