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

function fetchImage(ctx, blobstore, path, filename, revisionId, cb) {
  blobstore.doesBlobExist(ctx, path, filename, revisionId, function(err, exist) {
    if (exist) {
      blobstore.getBlobUrl(ctx, path, filename, revisionId, function(err, blobpath) {
        if (err) {
          return cb(err);
        }
        return cb(err, blobpath);
      });
    } else {
      return cb(null, false);
    }
  });
}

function buildSrcSet(ctx, blobstore, path, sizes, revisionId, next) {
  var blobNames = [
    {key: 's', filename: 'file-s.jpg', size: 240},
    {key: 'm', filename: 'file-m.jpg', size: 500},
    {key: 'l', filename: 'file-l.jpg', size: 1024},
    {key: 'k', filename: 'file-k.jpg', size: 2048}];
  async.map(blobNames, function(param, cb) {
    fetchImage(ctx, blobstore, path, param.filename, revisionId, function(err, blobpath) {
      if (err) {
        cb(err);
      }
      if (blobpath) {
        var scaleSize = imageScale.scaleBestFit(sizes.width, sizes.height, param.size);
        cb(err, blobpath + ' ' + scaleSize.width + 'w');
      } else {
        return cb();
      }
    });
  },function(err, results) {
    if (!err) {
      var set = results.filter(function(element, index, array) {
        if (element) {
          return element;
        }
      });
      return next(err, set.join(', '));
    }
    next(err);
  });
}

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
  this.editTemplate = 'edit';
  this.createTemplate = 'edit';

  this.postCreate = postCreate;

  this.commandRouter.routeAll('edit.html', upload.single('svg'));
  this.commandRouter.routeAll('create.html', upload.single('svg'));

  this.exposeFunc = function(req, res, next) {
    var editData = {
      path: req.sitepath.toDottedPath(),
      title: req.entity.summary.title,
      abstract: req.entity.summary.abstract
    };
    res.expose(editData, 'formData');
    res.expose({}, 'errors');
    res.serverVars.bundle = "bundles/vectorgraphic.js";
    res.serverVars.component = "vectorgraphic.jsx";
    res.serverVars.formData = editData;
    next();
  };

  this.exposeCreateFunc = function(req, res, next) {
    res.serverVars.bundle = "bundles/vectorgraphic.js";
    res.serverVars.component = "vectorgraphic.jsx";
    next();
  };

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
    var sameRevision = false;
    if (req.entity.curLogRev) {
      var isDraft = !req.entity.curLogRev.evtFinal;
      if (isDraft && saveAsDraft) {
        sameRevision = !validator.toBoolean(req.body.createNewDraft);
      }
    }

    var oldRevisionId = req.entity._revisionId;
    var blobstore = req.blobstores.getBlobStore('public');
    req.entity.summary.title = req.body.title;
    req.entity.summary.abstract = req.body.abstract;
    req.entity.updateTimes(now);
    if (req.file) {
      var sizes = sizeOf(req.file.buffer);
      req.entity.summary.size = {width: sizes.width, height: sizes.height};
    }
    update.updateEntity(req.db, req.ctx, req.access, oldent, req.entity, !saveAsDraft, sameRevision, 'test', function(err, entityId, revisionId, revisionNum) {
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
        if (!sameRevision) {
          req.blobstores.batchAlias(req.ctx, blobstore, req.entity.path().toDottedPath(),
            ['infile.jpg', 'file-t.jpg', 'file-m.jpg', 'file-s.jpg', 'file-k.jpg',
             'file-l.jpg', 'file-sq.jpg', 'file-st.jpg'],
            revisionId, true, false, oldRevisionId, function(err) {
              next(err);
            });
        } else {
          next();
        }
      }
    });
  };

  this.generateFigure = function(ctx, blobstores, entity, options, cb) {
    var figSize = options['data-size'];
    var figFloat = options['data-float'];
    var blobstore = blobstores.getBlobStore('public');
    var sizes = entity.summary.size;
    if (!figSize) {
      figSize = 'small';
    }
    buildSrcSet(ctx, blobstore, entity.path().toDottedPath(), sizes, entity._revisionId, function(err, srcset) {
      var scaleSize;
      if (figSize === 'medium') {
        scaleSize = '33vw';
      } else if (figSize === 'large') {
        scaleSize = '66vw';
      } else {
        scaleSize = '22vw';
      }
      if (!err) {
        return cb(null, '<img sizes="' + scaleSize + '" srcset="' + srcset + '">');
      }
      return cb(err);
    });
  };

  this.enhanceFunc = function(ctx, article, dbRow, scheme, site, blobstores, next) {
    var blobstore = blobstores.getBlobStore('public');
    var blobNames = [{key: 'alt', filename: 'file-sq.jpg'}];
    article.meta['rm3:icon'].sq = {};
    async.each(blobNames, function(param, cb) {
      fetchImage(ctx, blobstore, dbRow.path.toDottedPath(), param.filename, dbRow.revisionId, function(err, blobpath) {
        if (err) {
          return cb(err);
        }
        if (blobpath) {
          article.meta['rm3:icon'].sq[param.key] = blobpath;
          return cb(err);
        } else {
          return cb();
        }
      });
    },function(err) {
      next(err, article);
    });
  };

  this.postAlterFunc = function(revisionId, oldRevisionId, req, res, next) {
    var blobstore = req.blobstores.getBlobStore('public');
    req.blobstores.batchAlias(req.ctx, blobstore, req.entity.path().toDottedPath(),
      ['infile.jpg', 'file-t.jpg', 'file-m.jpg', 'file-s.jpg', 'file-k.jpg',
       'file-l.jpg', 'file-sq.jpg', 'file-st.jpg'],
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
    var sizes = req.entity.summary.size;
    var fallbackSize = imageScale.scaleBestFit(sizes.width, sizes.height, 500);
    res.serverVars.fallheight = fallbackSize.height;
    res.serverVars.fallwidth = fallbackSize.width;
    buildSrcSet(req.ctx, blobstore, req.entity.path().toDottedPath(), sizes, req.entity._revisionId, function(err, srcset) {
      if (!err) {
        res.serverVars.srcset = srcset;
      }
      next(err);
    });
  });

  this.viewRouter.get('', view.basicViewWithJsonView.bind(this, undefined, 'photo'));
}

util.inherits(VectorGraphicPage, Page);

module.exports = VectorGraphicPage;
