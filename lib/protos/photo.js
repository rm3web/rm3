var Page = require('../page');
var mixins = require('../mixins');
var view = require('../view');
var util = require("util");
var PhotoForm = require('../forms/photo.js');
var update = require ('../update'),
    validator = require('validator'),
    toSlug = require('../toslug'),
    textblocks = require('textblocks'),
    authorize = require('../authorize'),
    sanitize = require('../sanitize'),
    formlib = require('../formlib'),
    decorators = require('../decorators');
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
  var fileNames = ['file-s.jpg', 'file-m.jpg', 'file-l.jpg', 'file-k.jpg'];
  var exposedThumbnail;
  blobstores.fetchBlobBatch(ctx, blobstore, path, fileNames, revisionId, function(err, blobs) {
    var results = [];
    if (err) {
      next(err);
    }
    blobNames.forEach(function(param, index, array) {
      if (blobs[index]) {
        var scaleSize = imageScale.scaleBestFit(sizes.width, sizes.height, param.size);
        if (param.key === 'm') {
          exposedThumbnail = blobs[index];
        }
        results.push(blobs[index] + ' ' + scaleSize.width + 'w');
      }
    });
    var set = results.filter(function(element, index, array) {
      if (element) {
        return element;
      }
    });
    return next(err, set.join(', '),exposedThumbnail);
  });
}

function postCreate(ctx, site, entity, revisionId, next) {
  var params = {};
  params.ctx = ctx;
  params.path = entity.path().toDottedPath();
  params.filename = 'infile.jpg';
  params.scalefilename = 'file';
  params.revisionId = revisionId;
  params.sizes = entity.summary.size;
  if (entity.summary.protect) {
    params.inBlobstore = 'private';
    params.slug = '\u00A9' + site.copyright + ' - ' + site.urlroot;
  } else {
    params.inBlobstore = 'public';
  }
  workflow.launchWorkflow("photo.process.1", params, next);
}

function PhotoPage() {
  Page.call(this);
  this.proto = 'photo';
  this.editTemplate = 'edit';
  this.createTemplate = 'edit';

  this.postCreate = postCreate;

  this.commandRouter.routeAll('edit.html', upload.single('svg'));
  this.commandRouter.routeAll('create.html', upload.single('svg'));

  decorators.BlobViewDecorator(this, 'file-m.jpg', 'view.jpg');
  decorators.BlobViewDecorator(this, 'file-s.jpg', 'q.jpg');
  decorators.BlobViewDecorator(this, 'file-sq.jpg', 'sq.jpg');
  decorators.BlobViewDecorator(this, 'file-l.jpg', 'large.jpg');

  this.exposeFunc = function(editData, req, res, next) {
    formlib.copyViaDottedPath(editData, req.entity, PhotoForm.formToEntity);
    res.serverVars.bundle = "bundles/photo.js";
    res.serverVars.component = "photo.jsx";
    res.serverVars.formData = editData;
    res.expose(false, 'privateBlobstore');
    res.serverVars.privateBlobstore = false;
    next(null, editData);
  };

  this.exposeCreateFunc = function(editData, req, res, next) {
    res.serverVars.bundle = "bundles/photo.js";
    res.serverVars.component = "photo.jsx";
    var pvtBlobstore = req.blobstores.getBlobStore('private');
    if (pvtBlobstore) {
      res.serverVars.privateBlobstore = true;
      res.expose(true, 'privateBlobstore');
    } else {
      res.serverVars.privateBlobstore = false;
      res.expose(false, 'privateBlobstore');
    }
    next(null, editData);
  };

  this.createFunc = function(now, req, res, next) {
    var saveAsDraft = validator.toBoolean(req.body.saveAsDraft);
    if (validator.toBoolean(req.body.autogenSlug)) {
      var slug = toSlug(req.body.title);
      req.entity.createNew(req.sitepath.down(slug), req.page.proto, now);
    } else {
      req.entity.createNew(req.sitepath.down(req.body.leaf), req.page.proto, now);
    }
    var sizes = sizeOf(req.file.buffer);
    formlib.copyViaDottedPath(req.entity, req.body, PhotoForm.entityToForm);
    req.entity.summary.size = {width: sizes.width, height: sizes.height};
    req.entity.summary.abstract = sanitize.sanitizeXML(req.body.abstract);
    req.entity.summary.protect = validator.toBoolean(req.body.protect);
    var str = JSON.stringify(req.body.posting);
    req.entity.data.posting = textblocks.validateTextBlock(JSON.parse(str), {site: req.site});

    update.createEntity(req.db, req.ctx, req.access, req.entity, !saveAsDraft, req.body.memo, function(err, entityId, revisionId, revisionNum) {
      if (err) {
        return next(err);
      }
      var blobstore;
      if (req.entity.summary.protect) {
        blobstore = req.blobstores.getBlobStore('private');
      } else {
        blobstore = req.blobstores.getBlobStore('public');
      }

      blobstore.addBlob(req.ctx, req.entity.path().toDottedPath(), 'infile.jpg', revisionId, true, false, req.file.buffer, function(err) {
        if (err) {
          return next(err);
        }

        postCreate(req.ctx, req.site, req.entity, revisionId, function(err, jobid) {
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
    formlib.copyViaDottedPath(req.entity, req.body, PhotoForm.entityToForm);
    req.entity.summary.abstract = sanitize.sanitizeXML(req.body.abstract);
    var str = JSON.stringify(req.body.posting);
    req.entity.data.posting = textblocks.validateTextBlock(JSON.parse(str), {site: req.site});

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
      var blobstore = req.blobstores.getBlobStore('public');
      var inBlobstore;
      if (req.entity.summary.protect) {
        inBlobstore = req.blobstores.getBlobStore('private');
      } else {
        inBlobstore = req.blobstores.getBlobStore('public');
      }
      if (err) {
        return next(err);
      }
      if (req.file) {
        inBlobstore.addBlob(req.ctx, req.entity.path().toDottedPath(), 'infile.jpg', revisionId, true, false, req.file.buffer, function(err) {
          if (err) {
            return next(err);
          }

          postCreate(req.ctx, req.site, req.entity, revisionId, function(err, jobid) {
            if (err) {
              return next(err);
            }
            return res.redirect(req.site.sitePathToUrl(req.entity.path()));
          });
        });
      } else {
        if (!sameRevision) {
          req.blobstores.batchAlias(req.ctx, blobstore, req.entity.path().toDottedPath(),
            ['file-t.jpg', 'file-m.jpg', 'file-s.jpg', 'file-k.jpg',
              'file-l.jpg', 'file-sq.jpg', 'file-st.jpg'],
            revisionId, true, false, oldRevisionId, function(err) {
              req.blobstores.batchAlias(req.ctx, inBlobstore, req.entity.path().toDottedPath(),
                ['infile.jpg'],
                revisionId, true, false, oldRevisionId, function(err) {
                  next(err);
                });
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
        scaleSize = '25vw';
      } else if (figSize === 'large') {
        scaleSize = '50vw';
      } else {
        scaleSize = '12vw';
      }
      if (!err) {
        if (entity.summary.protect) {
          return cb(null, '<div style="overflow: hidden; line-height: 0px; width: ' + scaleSize +
            ' "><img sizes="' + scaleSize + '" srcset="' + srcset + '" ' +
            floatStr + 'style="position: relative; bottom: -16px;" /></div>');
        } else {
          return cb(null, '<img sizes="' + scaleSize + '" srcset="' + srcset + '" ' +
            floatStr + ' />');
        }
      }
      return cb(err);
    });
  };

  this.enhanceFunc = function(ctx, article, dbRow, scheme, site, blobstores, next) {
    var blobstore = blobstores.getBlobStore('public');
    var blobNames = [{key: 'alt', filename: 'file-sq.jpg'}];
    var sizes = dbRow.summary.size;
    article.meta['rm3:icon'].sq = {'height': 75, 'width': 75};
    article.meta['rm3:protect'] = dbRow.summary.protect;
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
      buildSrcSet(ctx, blobstores, blobstore, dbRow.path.toDottedPath(), sizes, dbRow.revisionId, function(err, srcset) {
        article.meta['rm3:srcset'] = srcset;
        article.meta['rm3:sizes'] = sizes;
        next(err, article);
      });
    });
  };

  this.postAlterFunc = function(revisionId, oldRevisionId, req, res, next) {
    var blobstore = req.blobstores.getBlobStore('public');
    var inBlobstore;
    if (req.entity.summary.protect) {
      inBlobstore = req.blobstores.getBlobStore('private');
    } else {
      inBlobstore = req.blobstores.getBlobStore('public');
    }

    req.blobstores.batchAlias(req.ctx, blobstore, req.entity.path().toDottedPath(),
      ['file-t.jpg', 'file-m.jpg', 'file-s.jpg', 'file-k.jpg',
        'file-l.jpg', 'file-sq.jpg', 'file-st.jpg'],
      revisionId, true, false, oldRevisionId, function(err) {
        req.blobstores.batchAlias(req.ctx, inBlobstore, req.entity.path().toDottedPath(),
          ['infile.jpg'],
          revisionId, true, false, oldRevisionId, function(err) {
            next(err);
          });
      });
  };

  this.validateForm = function(update, body, next) {
    var photoForm = new PhotoForm(update);
    photoForm.checkForm(body, next);
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

util.inherits(PhotoPage, Page);

module.exports = PhotoPage;
