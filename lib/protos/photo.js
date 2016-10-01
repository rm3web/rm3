var Page = require('../page');
var mixins = require('../mixins');
var view = require('../view');
var util = require("util");
var VectorGraphicForm = require('../forms/vectorgraphic.js');
var update = require ('../update'),
    validator = require('validator'),
    toSlug = require('../toslug'),
    textblocks = require('textblocks'),
    authorize = require('../authorize'),
    sanitize = require('../sanitize'),
    formlib = require('../formlib');
var workflow = require('../workflow');
var sizeOf = require('image-size');
var async = require('async');
var multer  = require('multer');
var storage = multer.memoryStorage();
var upload = multer({storage: storage});
var imageScale = require('../imagescale');

function buildSrcSet(ctx, blobstores, blobstore, path, sizes, revisionId, next) {
  var blobNames = [
    {key: 's', filename: 'file-s.jpg', size: 240},
    {key: 'm', filename: 'file-m.jpg', size: 500},
    {key: 'l', filename: 'file-l.jpg', size: 1024},
    {key: 'k', filename: 'file-k.jpg', size: 2048}];
  var exposedThumbnail;
  async.map(blobNames, function(param, cb) {
    blobstores.fetchBlob(ctx, blobstore, path, param.filename, revisionId, function(err, blobpath) {
      if (err) {
        cb(err);
      }
      if (blobpath) {
        var scaleSize = imageScale.scaleBestFit(sizes.width, sizes.height, param.size);
        cb(err, blobpath + ' ' + scaleSize.width + 'w');
        if (param.key === 'm') {
          exposedThumbnail = blobpath;
        }
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
      return next(err, set.join(', '),exposedThumbnail);
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

  this.securityRouter.get('view.jpg', authorize({permission: 'view'}));
  this.viewRouter.get('view.jpg', function(req, res, next) {
    var blobstore = req.blobstores.getBlobStore('public');
    req.blobstores.fetchBlob(req.ctx, blobstore, req.entity.path().toDottedPath(), 'file-m.jpg', req.entity._revisionId, function(err, path) {
      res.redirect(302, path);
    });
  });

  this.securityRouter.get('q.jpg', authorize({permission: 'view'}));
  this.viewRouter.get('q.jpg', function(req, res, next) {
    var blobstore = req.blobstores.getBlobStore('public');
    req.blobstores.fetchBlob(req.ctx, blobstore, req.entity.path().toDottedPath(), 'file-s.jpg', req.entity._revisionId, function(err, path) {
      res.redirect(302, path);
    });
  });

  this.securityRouter.get('sq.jpg', authorize({permission: 'view'}));
  this.viewRouter.get('sq.jpg', function(req, res, next) {
    var blobstore = req.blobstores.getBlobStore('public');
    req.blobstores.fetchBlob(req.ctx, blobstore, req.entity.path().toDottedPath(), 'file-sq.jpg', req.entity._revisionId, function(err, path) {
      res.redirect(302, path);
    });
  });

  this.securityRouter.get('large.jpg', authorize({permission: 'view'}));
  this.viewRouter.get('large.jpg', function(req, res, next) {
    var blobstore = req.blobstores.getBlobStore('public');
    req.blobstores.fetchBlob(req.ctx, blobstore, req.entity.path().toDottedPath(), 'file-l.jpg', req.entity._revisionId, function(err, path) {
      res.redirect(302, path);
    });
  });

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
    var blobstore = req.blobstores.getBlobStore('public');

    var saveAsDraft = validator.toBoolean(req.body.saveAsDraft);
    if (validator.toBoolean(req.body.autogenSlug)) {
      var slug = toSlug(req.body.title);
      req.entity.createNew(req.sitepath.down(slug), req.page.proto, now);
    } else {
      req.entity.createNew(req.sitepath.down(req.body.leaf), req.page.proto, now);
    }
    var sizes = sizeOf(req.file.buffer);
    formlib.copyViaDottedPath(req.entity, req.body, VectorGraphicForm.entityToForm);
    req.entity.summary.size = {width: sizes.width, height: sizes.height};
    req.entity.summary.abstract = sanitize.sanitizeXML(req.body.abstract);
    var str = JSON.stringify(req.body.posting);
    req.entity.data.posting = textblocks.validateTextBlock(JSON.parse(str));

    update.createEntity(req.db, req.ctx, req.access, req.entity, !saveAsDraft, req.body.memo, function(err, entityId, revisionId, revisionNum) {
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
    req.entity.summary.abstract = sanitize.sanitizeXML(req.body.abstract);
    var str = JSON.stringify(req.body.posting);
    req.entity.data.posting = textblocks.validateTextBlock(JSON.parse(str));

    if (minorChange) {
      req.entity.updateTouched(now);
    } else {
      req.entity.updateTimes(now);
    }
    if (req.file) {
      var sizes = sizeOf(req.file.buffer);
      req.entity.summary.size = {width: sizes.width, height: sizes.height};
    }
    update.updateEntity(req.db, req.ctx, req.access, oldent, req.entity, !saveAsDraft, sameRevision, req.body.memo, function(err, entityId, revisionId, revisionNum) {
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
    var floatStr = '';
    buildSrcSet(ctx, blobstores, blobstore, entity.path().toDottedPath(), sizes, entity._revisionId, function(err, srcset, exposedThumbnail) {
      var scaleSize;
      if (figSize === 'medium') {
        scaleSize = '33vw';
      } else if (figSize === 'large') {
        scaleSize = '50vw';
      } else {
        scaleSize = '22vw';
      }
      if (!err) {
        return cb(null, '<img sizes="' + scaleSize + '" srcset="' + srcset + '" ' +
          floatStr + '>');
      }
      return cb(err);
    });
  };

  this.enhanceFunc = function(ctx, article, dbRow, scheme, site, blobstores, next) {
    var blobstore = blobstores.getBlobStore('public');
    var blobNames = [{key: 'alt', filename: 'file-sq.jpg'}];
    article.meta['rm3:icon'].sq = {};
    article.thumbnail = true;
    async.each(blobNames, function(param, cb) {
      blobstores.fetchBlob(ctx, blobstore, dbRow.path.toDottedPath(), param.filename, dbRow.revisionId, function(err, blobpath) {
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
    buildSrcSet(req.ctx, req.blobstores, blobstore, req.entity.path().toDottedPath(), sizes, req.entity._revisionId, function(err, srcset, exposedThumbnail) {
      if (!err) {
        res.serverVars.srcset = srcset;
        res.serverVars.ogThumbnail = exposedThumbnail;
      }
      next(err);
    });
  });

  this.viewRouter.get('', view.basicViewWithJsonView.bind(this, undefined, 'photo'));
}

util.inherits(VectorGraphicPage, Page);

module.exports = VectorGraphicPage;
