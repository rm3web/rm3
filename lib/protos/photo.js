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
var imageScale = require('../imagescale');

function postCreate(ctx, entity, revisionId, next) {
  var params = {};
  params.ctx = ctx;
  params.path = entity.path().toDottedPath();
  params.filename = 'infile.jpg';
  params.scalefilename = 'file';
  params.revisionId = revisionId;
  params.sizes = entity.summary.size;
  workflow.launchWorkflow("photo.process.1", params, next);
}

function VectorGraphicPage() {
  Page.call(this);
  this.proto = 'photo';
  this.editTemplate = 'edit-vectorgraphic';
  this.createTemplate = 'edit-vectorgraphic';

  this.postCreate = postCreate;

  this.commandRouter.routeAll('edit.html', upload.single('svg'));
  this.commandRouter.routeAll('create.html', upload.single('svg'));

  this.createFunc = function(now, req, res, next) {
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

    update.createEntity(req.db, req.ctx, req.access, req.entity, !saveAsDraft, 'test', function(err, entityId, revisionId, revisionNum) {
      if (err) {
        return next(err);
      }
      blobstore.addBlob(req.ctx, req.entity.path().toDottedPath(), 'infile.jpg', revisionId, true, false, req.file.buffer, function(err) {
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
    if (req.file) {
      var sizes = sizeOf(req.file.buffer);
      req.entity.summary.size = {width: sizes.width, height: sizes.height};
    }
    update.updateEntity(req.db, req.ctx, req.access, oldent, req.entity, !saveAsDraft, 'test', function(err, entityId, revisionId, revisionNum) {
      if (err) {
        return next(err);
      }
      if (req.file) {
        blobstore.addBlob(req.ctx, req.entity.path().toDottedPath(), 'infile.jpg', revisionId, true, false, req.file.buffer, function(err) {
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
          ['infile.jpg', 'file-t.jpg', 'file-m.jpg', 'file-s.jpg', 'file-k.jpg',
           'file-l.jpg', 'file-sq.jpg', 'file-st.jpg'],
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
    var sizes = req.entity.summary.size;
    var fallbackSize = imageScale.scaleBestFit(sizes.width, sizes.height, 500);
    res.serverVars.fallheight = fallbackSize.height;
    res.serverVars.fallwidth = fallbackSize.width;
    var blobNames = [
      {key: 's', filename: 'file-s.jpg', size: 240},
      {key: 'm', filename: 'file-m.jpg', size: 500},
      {key: 'l', filename: 'file-l.jpg', size: 1024},
      {key: 'k', filename: 'file-k.jpg', size: 2048}];
    async.map(blobNames, function(param, cb) {
      blobstore.doesBlobExist(req.ctx, req.entity.path().toDottedPath(), param.filename, req.entity._revisionId, function(err, exist) {
        if (exist) {
          blobstore.getBlobUrl(req.ctx, req.entity.path().toDottedPath(), param.filename, req.entity._revisionId, function(err, path) {
            var scaleSize = imageScale.scaleBestFit(sizes.width, sizes.height, param.size);
            cb(err, path + ' ' + scaleSize.width + 'w');
          });
        } else {
          cb();
        }
      });
    },function(err, results) {
      if (!err) {
        var set = results.filter(function(element, index, array) {
          if (element) {
            return element;
          }
        });
        res.serverVars.srcset = set.join(', ');
      }
      next(err);
    });
  });

  this.viewRouter.get('', view.basicViewWithJsonView.bind(this, undefined, 'photo', null));
}

util.inherits(VectorGraphicPage, Page);

module.exports = VectorGraphicPage;
