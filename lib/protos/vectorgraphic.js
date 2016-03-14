var Page = require('../page');
var mixins = require('../mixins');
var view = require('../view');
var util = require("util");
var VectorGraphicForm = require('../forms/vectorgraphic.js');
var update = require ('../update'),
    validator = require('validator'),
    getSlug = require('speakingurl');
var workflow = require('../workflow');

var multer  = require('multer');
var storage = multer.memoryStorage();
var upload = multer({storage: storage});

function toSlug(url) {
  return getSlug(url, {
    separator: '_',
    truncate: -48,
    custom: {
      '-': '_'
    }
  });
}

function VectorGraphicPage() {
  Page.call(this);
  this.proto = 'vectorgraphic';
  this.editTemplate = 'edit-vectorgraphic';
  this.createTemplate = 'edit-vectorgraphic';

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
    req.entity.summary.title = req.body.title;
    req.entity.summary.abstract = req.body.abstract;
    update.createEntity(req.db, req.ctx, req.access, req.entity, !saveAsDraft, 'test',
    function(err, entityId, revisionId, revisionNum) {
      if (err) {
        return next(err);
      }
      blobstore.addBlob(req.ctx, req.entity.path().toDottedPath(), 'infile.svg', revisionId, true, false, req.file.buffer, function(err) {
        if (err) {
          return next(err);
        }

        var params = {};
        params.ctx = req.ctx;
        params.path = req.entity.path().toDottedPath();
        params.filename = 'infile.svg';
        params.svgofilename = 'file.svg';
        params.revisionId = revisionId;
        workflow.launchWorkflow("vectorgraphic.process.1", params, function(err, jobid) {
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
    req.entity.summary.title = req.body.title;
    req.entity.summary.abstract = req.body.abstract;
    req.entity.updateTimes(now);
    update.updateEntity(req.db, req.ctx, req.access, oldent, req.entity, !saveAsDraft, 'test', next);
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
    blobstore.getBlobUrl(req.ctx, req.entity.path().toDottedPath(), 'file.svg',
                         req.entity._revisionId, function(err, path) {
      res.serverVars.svg = path;
      next();
    });
  });

  this.viewRouter.get('', view.basicViewWithJsonView.bind(this, undefined, 'vectorgraphic', null));
}

util.inherits(VectorGraphicPage, Page);

module.exports = VectorGraphicPage;
