var update = require ('../update'),
    logging = require('../logging'),
    authorize = require('../authorize'),
    PageForm = require('../forms/page.js'),
    validator = require('validator'),
    textblocks = require('textblocks'),
    getSlug = require('speakingurl'),
    view = require('../view');

var boundLogger = logging.getRootLogger('mixins.basebehavior');

function toSlug(url) {
  return getSlug(url, {
    separator: '_',
    truncate: -48,
    custom: {
      '-': '_'
    }
  });
}

function selectTemplate(section, template, resolve, req, res, next) {
  var tmp = template;
  if (template === 'edit') {
    if (this.editTemplate) {
      tmp = this.editTemplate;
    }
  } else if (template === 'create') {
    if (this.createTemplate) {
      tmp = this.createTemplate;
    }
  }
  view.basicView(section, tmp, resolve, req, res, next);
}

function validateForm(update, body, next) {
  var pageForm = new PageForm(update);
  pageForm.checkForm(body, next);
}

function doStandardEdit(oldent, now, req, res, next) {
  var saveAsDraft = validator.toBoolean(req.body.saveAsDraft);
  req.entity.data.posting = textblocks.validateTextBlock(req.body.posting);
  req.entity.summary.title = req.body.title;
  req.entity.summary.abstract = req.body.abstract;
  req.entity.updateTimes(now);
  update.updateEntity(req.db, req.ctx, req.access, oldent, req.entity, !saveAsDraft, 'test', next);
}

function doStandardCreate(now, req, res, next) {
  var saveAsDraft = validator.toBoolean(req.body.saveAsDraft);
  if (validator.toBoolean(req.body.autogenSlug)) {
    var slug = toSlug(req.body.title);
    req.entity.createNew(req.sitepath.down(slug), req.page.proto, now);
  } else {
    req.entity.createNew(req.sitepath.down(req.body.leaf), req.page.proto, now);
  }
  req.entity.data.posting = textblocks.validateTextBlock(req.body.posting);
  req.entity.summary.title = req.body.title;
  req.entity.summary.abstract = req.body.abstract;
  update.createEntity(req.db, req.ctx, req.access, req.entity, !saveAsDraft, 'test',
  function(err, entityId, revisionId, revisionNum) {
    if (err) {
      return next(err);
    } else {
      return res.redirect(req.site.sitePathToUrl(req.entity.path()));
    }
  });
}

function BaseBehaviorMixin(page) {
  page.commandRouter.routeAll('edit.html', authorize({requiresAuth: true, permission: 'edit'}));
  page.commandRouter.routeAll('publish.html', authorize({requiresAuth: true, permission: 'edit'}));
  page.commandRouter.routeAll('create.html', authorize({requiresAuth: true, effectivePermission: 'edit'}));
  page.commandRouter.routeAll('tag.html', authorize({requiresAuth: true, effectivePermission: 'edit'}));

  page.commandRouter.post('tag.html', function(req, res, next) {
    var oldent = req.entity.clone();
    var objKey;
    if (req.body.action === "addtag") {
      objKey = validator.stripLow(req.body.objKey);
      req.entity.addTag(null, objKey);
      update.updateEntity(req.db, req.ctx, req.access, oldent, req.entity, true, 'test', next);
    } else if (req.body.action === "rmtag") {
      objKey = validator.stripLow(req.body.objKey);
      req.entity.removeTag(null, objKey);
      update.updateEntity(req.db, req.ctx, req.access, oldent, req.entity, true, 'test', next);
    } else if (req.body.action === "navbar") {
      req.entity.addTag("navigation", "navbar");
      update.updateEntity(req.db, req.ctx, req.access, oldent, req.entity, true, 'test', next);
    } else {
      return logging.logAndCreateError(boundLogger, 'tag.html bad action',
            'page.validation', {
            ctx: req.ctx,
            msg: "invalid tagging action"
          }, next);
    }
  });

  page.commandRouter.post('edit.html', function(req, res, next) {
    var now = new Date();
    var oldent = req.entity.clone();
    var validFunc = validateForm;
    if (this.validateForm) {
      validFunc = validateForm;
    }
    validFunc(true, req.body, function(err) {
      if (err) {
        res.status(400);
        res.serverVars.errors = err;
        res.serverVars.body = req.body;
        res.expose(err, 'errors');

        boundLogger.error('edit.html error', {
          ctx: req.ctx,
          details: err
        });
        return next();
      } else {
        var editFunc = doStandardEdit;
        if (page.editFunc) {
          editFunc = page.editFunc;
        }
        editFunc(oldent, now, req, res, next);
      }
    });
  });

  page.commandRouter.get('create.html', function(req, res, next) {
    var now = new Date();
    req.entity.createNew(req.sitepath.down(req.body.path), req.page.proto, now);
    req.entity.data.posting = textblocks.makeTextBlock('', 'html');
    next();
  });

  page.commandRouter.post('publish.html', function(req, res, next) {
    var now = new Date();
    var revisionId = req.body.revisionId;
    if (validator.isUUID(revisionId)) {
      update.commitEntityRev(req.db, req.ctx, revisionId,
        function(err, entityId, revisionId, revisionNum) {
          if (err) {
            return next(err);
          }
          req.flash('info', 'Revision published');
          return res.redirect(req.site.sitePathToUrl(req.entity.path()));
        });
    } else {
      return logging.logAndCreateError(boundLogger, 'authorize not allowed',
        'page.validation.bad_revision_id', {
        ctx: req.ctx,
        revisionId: revisionId
      }, next);
    }
  });

  page.commandRouter.post('create.html', function(req, res, next) {
    var now = new Date();
    var validFunc = validateForm;
    if (this.validateForm) {
      validFunc = validateForm;
    }
    validFunc(false, req.body, function(err) {
      if (err) {
        res.status(400);
        res.expose(err, 'errors');
        res.serverVars.errors = err;
        res.serverVars.body = req.body;

        boundLogger.error('edit.html error', {
          ctx: req.ctx,
          details: err
        });
        return next();
      } else {
        var createFunc = doStandardCreate;
        if (page.createFunc) {
          createFunc = page.createFunc;
        }
        createFunc(now, req, res, next);
      }
    });
  });

  page.viewRouter.get('tag.cgi', function(req, res, next) {
    res.format({
      'application/json': function() {
        var view = req.entity.view();
        var data = {
          tags: view.tags,
        };
        res.json(data);
        res.end();
      }
    });
  });

  page.viewRouter.get('allowedtags.cgi', function(req, res, next) {
    res.format({
      'application/json': function() {
        var view = req.entity.view();
        var data = {
          autocomplete: null,
          predicates: [
            {
              id: 'dc:subject',
              name: 'Dublin Core: Subject',
              metadataClass: 'Dublin Core'},
            {
              id: 'dc:creator',
              name: 'Dublin Core: Creator',
              metadataClass: 'Dublin Core'},
            {
              id: 'dc:coverage',
              name: 'Dublin Core: Coverage',
              metadataClass: 'Dublin Core'},
            {
              id: 'pony',
              name: 'OMG Ponies',
              metadataClass: 'Ponies'},
          ]
        };
        res.json(data);
        res.end();
      }
    });
  });

  page.viewRouter.routeAll('edit.html', function(req, res, next) {
    var editData = {
      path: req.sitepath.toDottedPath(),
      title: req.entity.summary.title,
      abstract: req.entity.summary.abstract,
      block: req.entity.data.posting
    };
    res.expose(editData, 'formData');
    next();
  });

  page.viewRouter.routeAll('create.html', function(req, res, next) {
    var editData = {
      path: req.sitepath.toDottedPath(),
    };
    res.expose(editData, 'formData');
    next();
  });

  page.viewRouter.routeAll('edit.html', selectTemplate.bind(page, 'edit', 'edit', null));
  page.viewRouter.routeAll('create.html', selectTemplate.bind(page, 'create', 'create', null));
  page.viewRouter.routeAll('tag.html', view.basicView.bind(page, 'tag', 'tag', null));
}

exports = module.exports = BaseBehaviorMixin;