var Page = require('../page');
var mixins = require('../mixins');
var view = require('../view');
var util = require("util");
var VectorGraphicForm = require('../forms/vectorgraphic.js');
var update = require ('../update'),
    validator = require('validator'),
    toSlug = require('../toslug');
var workflow = require('../workflow');
var sizeOf = require('image-size');
var async = require('async');
var multer  = require('multer');
var storage = multer.memoryStorage();
var upload = multer({storage: storage});

function postCreate(ctx, entity, revisionId, next) {
  var params = {};
  params.ctx = ctx;
  params.path = entity.path().toDottedPath();
  params.filename = 'infile.svg';
  params.svgofilename = 'file.svg';
  params.rsvgfilename = 'file';
  params.revisionId = revisionId;
  params.sizes = entity.summary.size;
  workflow.launchWorkflow("vectorgraphic.process.1", params, next);
}

function VectorGraphicPage() {
  Page.call(this);
  this.proto = 'vectorgraphic';
  this.editTemplate = 'edit-vectorgraphic';
  this.createTemplate = 'edit-vectorgraphic';

  this.commandRouter.routeAll('edit.html', upload.single('svg'));
  this.commandRouter.routeAll('create.html', upload.single('svg'));

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
    var sizes = sizeOf(req.file.buffer);
    req.entity.summary.title = req.body.title;
    req.entity.summary.abstract = req.body.abstract;
    req.entity.summary.size = {width: sizes.width, height: sizes.height};

    update.createEntity(req.db, req.ctx, req.access, req.entity, !saveAsDraft, 'test',
    function(err, entityId, revisionId, revisionNum) {
      if (err) {
        return next(err);
      }
      blobstore.addBlob(req.ctx, req.entity.path().toDottedPath(), 'infile.svg', revisionId, true, false, req.file.buffer, function(err) {
        if (err) {
          return next(err);
        }
        postCreate(req.ctx, req.entity, revisionId, function(err, jobid) {
          if (err) {
            return next(err);
          }
          return res.redirect(req.site.sitePathToUrl(req.entity.path()));
        });
      });
    });
  };

  this.editFunc = function(oldent, now, req, res, next) {
    var saveAsDraft = validator.toBoolean(req.body.saveAsDraft);
    var oldRevisionId = req.entity._revisionId;
    var blobstore = req.blobstores.getBlobStore('public');
    req.entity.summary.title = req.body.title;
    req.entity.summary.abstract = req.body.abstract;
    req.entity.updateTimes(now);

    update.updateEntity(req.db, req.ctx, req.access, oldent, req.entity, !saveAsDraft, 'test', function(err, entityId, revisionId, revisionNum) {
      if (err) {
        return next(err);
      }
      if (req.file) {
        blobstore.addBlob(req.ctx, req.entity.path().toDottedPath(), 'infile.svg', revisionId, true, false, req.file.buffer, function(err) {
          if (err) {
            return next(err);
          }
          postCreate(req.ctx, req.entity, revisionId, function(err, jobid) {
            if (err) {
              return next(err);
            }
            return res.redirect(req.site.sitePathToUrl(req.entity.path()));
          });
        });
      } else {
        req.blobstores.batchAlias(req.ctx, blobstore, req.entity.path().toDottedPath(),
          ['infile.svg', 'file.png', 'file-t.png', 'file-m.png', 'file-s.png', 'file-k.png',
           'file-l.png', 'file-sq.png', 'file-st.png', 'file.svg'],
          revisionId, true, false, oldRevisionId, function(err) {
            next(err);
          });
      }
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
    var blobNames = [{key: 'svg', filename: 'file.svg'}, {key: 'png', filename: 'file.png'}];
    async.each(blobNames, function(param, cb) {
      blobstore.doesBlobExist(req.ctx, req.entity.path().toDottedPath(), param.filename, req.entity._revisionId, function(err, exist) {
        if (exist) {
          blobstore.getBlobUrl(req.ctx, req.entity.path().toDottedPath(), param.filename, req.entity._revisionId, function(err, path) {
            res.serverVars[param.key] = path;
            cb(err);
          });
        } else {
          cb();
        }
      });
    },next);
  });

  this.viewRouter.get('', view.basicViewWithJsonView.bind(this, undefined, 'vectorgraphic', null));
}

util.inherits(VectorGraphicPage, Page);

module.exports = VectorGraphicPage;
