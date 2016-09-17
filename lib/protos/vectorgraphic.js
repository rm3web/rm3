var Page = require('../page');
var mixins = require('../mixins');
var view = require('../view');
var util = require("util");
var VectorGraphicForm = require('../forms/vectorgraphic.js');
var update = require ('../update'),
    validator = require('validator'),
    toSlug = require('../toslug'),
    textblocks = require('textblocks'),
    sanitize = require('../sanitize'),
    formlib = require('../formlib');
var workflow = require('../workflow');
var sizeOf = require('image-size');
var async = require('async');
var multer  = require('multer');
var storage = multer.memoryStorage();
var upload = multer({storage: storage});
var imageScale = require('../imagescale');

var svgPlaceholderBox =  '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">\
<rect width="100" height="100" style="fill:rgba(0,0,0,0);stroke-width:1;stroke:rgb(0,0,0)" />\
</svg>';

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

function fetchBothImages(ctx, blobstore, path, filename, svgname, sizes, scale, revisionId, floatStr, cb) {
  fetchImage(ctx, blobstore, path, filename, revisionId, function(err, blobpath) {
    if (err) {
      return cb(err, svgPlaceholderBox);
    }
    fetchImage(ctx, blobstore, path, svgname, revisionId, function(err, svgpath) {
      if (blobpath && svgpath) {
        var scaleSize = imageScale.scaleBestFit(sizes.width, sizes.height, scale);
        var str = '<picture ' + floatStr + '><source srcset="' + svgpath + '" ' +
                  ' type="image/svg+xml"><img srcset="' + blobpath + ' height="' +
                  scaleSize.height + '" width="' + scaleSize.width + '" border="0" /></picture>';
        return cb(err, str);
      }
      return cb(err, svgPlaceholderBox);
    });
  });
}

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
  this.editTemplate = 'edit';
  this.createTemplate = 'edit';

  this.postCreate = postCreate;

  this.commandRouter.routeAll('edit.html', upload.single('svg'));
  this.commandRouter.routeAll('create.html', upload.single('svg'));

  this.securityRouter.get('download.cgi', authorize({permission: 'view'}));
  this.viewRouter.get('download.cgi', function(req, res, next) {
    var blobstore = req.blobstores.getBlobStore('public');
    fetchImage(req.ctx, blobstore, req.entity.path().toDottedPath(), 'file.png', req.entity._revisionId, function(err, path) {
      res.redirect(302, path);
    })
  })

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
    var sizes = sizeOf(req.file.buffer);
    formlib.copyViaDottedPath(req.entity, req.body, VectorGraphicForm.entityToForm);
    req.entity.summary.size = {width: sizes.width, height: sizes.height};
    req.entity.summary.abstract = sanitize.sanitizeXML(req.body.abstract);
    var str = JSON.stringify(req.body.posting);
    req.entity.data.posting = textblocks.validateTextBlock(JSON.parse(str));

    update.createEntity(req.db, req.ctx, req.access, req.entity, !saveAsDraft, req.body.memo,
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
        if (!sameRevision) {
          req.blobstores.batchAlias(req.ctx, blobstore, req.entity.path().toDottedPath(),
            ['infile.svg', 'file.png', 'file-t.png', 'file-m.png', 'file-s.png', 'file-k.png',
             'file-l.png', 'file-sq.png', 'file-st.png', 'file.svg'],
            revisionId, true, false, oldRevisionId, function(err) {
              next(err);
            });
        } else {
          next();
        }
      }
    });
  };

  this.postAlterFunc = function(revisionId, oldRevisionId, req, res, next) {
    var blobstore = req.blobstores.getBlobStore('public');
    req.blobstores.batchAlias(req.ctx, blobstore, req.entity.path().toDottedPath(),
      ['infile.svg', 'file.png', 'file-t.png', 'file-m.png', 'file-s.png', 'file-k.png',
       'file-l.png', 'file-sq.png', 'file-st.png', 'file.svg'],
      revisionId, true, false, oldRevisionId, function(err) {
        next(err);
      });
  };

  this.validateForm = function(update, body, next) {
    var vectorGraphicForm = new VectorGraphicForm(update);
    vectorGraphicForm.checkForm(body, next);
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
    if (figSize === 'small') {
      fetchBothImages(ctx, blobstore, entity.path().toDottedPath(), 'file-s.png', 'file.svg', sizes, 240, entity._revisionId, floatStr, cb);
    } else if (figSize === 'medium') {
      fetchBothImages(ctx, blobstore, entity.path().toDottedPath(), 'file-m.png', 'file.svg', sizes, 500, entity._revisionId, floatStr, cb);
    } else if (figSize === 'large') {
      fetchBothImages(ctx, blobstore, entity.path().toDottedPath(), 'file-l.png', 'file.svg', sizes, 1024, entity._revisionId, floatStr, cb);
    } else {
      fetchBothImages(ctx, blobstore, entity.path().toDottedPath(), 'file-s.png', 'file.svg', sizes, 240, entity._revisionId, floatStr, cb);
    }
  };

  this.enhanceFunc = function(ctx, article, dbRow, scheme, site, blobstores, next) {
    var blobstore = blobstores.getBlobStore('public');
    var blobNames = [{key: 'svg', filename: 'file.svg'}, {key: 'alt', filename: 'file-sq.png'}];
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

  mixins.DeletableMixin(this);
  mixins.BaseBehaviorMixin(this);
  mixins.HistoryViewMixin(this);
  mixins.TagSearchViewMixin(this);

  this.viewRouter.get('', function(req, res, next) {
    var blobstore = req.blobstores.getBlobStore('public');
    var blobNames = [{key: 'svg', filename: 'file.svg'}, {key: 'png', filename: 'file.png'}];
    async.each(blobNames, function(param, cb) {
      fetchImage(req.ctx, blobstore, req.entity.path().toDottedPath(), param.filename, req.entity._revisionId, function(err, blobpath) {
        if (err) {
          return cb(err);
        }
        if (blobpath) {
          res.serverVars[param.key] = blobpath;
        }
        cb();
      });
    },next);
  });

  this.viewRouter.get('', view.basicViewWithJsonView.bind(this, undefined, 'vectorgraphic'));
}

util.inherits(VectorGraphicPage, Page);

module.exports = VectorGraphicPage;
