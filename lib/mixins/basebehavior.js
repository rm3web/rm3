var update = require ('../update'),
    logging = require('../logging'),
    authorize = require('../authorize'),
    PageForm = require('../forms/page.js'),
    validator = require('validator'),
    textblocks = require('textblocks'),
    toSlug = require('../toslug'),
    view = require('../view'),
    query = require('../query');

var boundLogger = logging.getRootLogger('mixins.basebehavior');

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
  page.commandRouter.routeAll('', authorize({permission: 'view'}));
  page.commandRouter.routeAll('edit.html', authorize({requiresAuth: true, permission: 'edit'}));
  page.commandRouter.routeAll('publish.html', authorize({requiresAuth: true, permission: 'edit'}));
  page.commandRouter.routeAll('create.html', authorize({requiresAuth: true, effectivePermission: 'edit'}));
  page.commandRouter.routeAll('tag.html', authorize({requiresAuth: true, effectivePermission: 'edit'}));
  page.commandRouter.put('tags.cgi', authorize({requiresAuth: true, effectivePermission: 'edit'}));
  page.commandRouter.post('togglenavbar.cgi', authorize({requiresAuth: true, effectivePermission: 'edit'}));

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

  page.commandRouter.post('togglenavbar.cgi', function(req, res, next) {
    var oldent = req.entity.clone();
    var navbar;
    if (req.entity.hasTag("navigation", "navbar")) {
      req.entity.removeTag("navigation", "navbar");
      navbar = false;
    } else {
      req.entity.addTag("navigation", "navbar");
      navbar = true;
    }
    update.updateEntity(req.db, req.ctx, req.access, oldent, req.entity, true, 'test', function(err) {
      res.status(200);
      res.json({navbar: navbar});
      return res.end();
    });
  });

  page.commandRouter.put('tags.cgi', function(req, res, next) {
    var oldent = req.entity.clone();
    if (req.body.hasOwnProperty('tags')) {
      req.entity.tagsFromJSON(req.body.tags);
      update.updateEntity(req.db, req.ctx, req.access, oldent, req.entity, true, 'edit tags', next);
    } else {
      return logging.logAndCreateError(boundLogger, 'tag.cgi invalid data',
              'page.validation', {
                ctx: req.ctx,
                msg: "invalid tag data"
              }, next);
    }
  });

  page.commandRouter.post('edit.html', function(req, res, next) {
    var now = new Date();
    var oldent = req.entity.clone();
    var validFunc = validateForm;
    if (page.validateForm) {
      validFunc = page.validateForm;
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
    if (page.validateForm) {
      validFunc = page.validateForm;
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

  page.viewRouter.routeAll('tags.cgi', function(req, res, next) {
    res.format({
      'application/json': function() {
        var view = req.entity.view();

        var resp = query.query(req.db, req.ctx, req.access,
          req.site.root, 'child', 'entity', {'predicates': true},
          undefined, undefined, {});
        var preds = [];
        preds.push({'id': 'plain',
            'name': 'Plain tag (no semantic information)',
            'metadataClass': 'plain'});

        resp.on('article', function(article) {
          preds.push({
            'id': article.path.toDottedPath(),
            'name': article.summary.title,
            'metadataClass': 'plain'});
        });
        resp.on('error', function(err) {
          console.log(err);
        });
        resp.on('end', function() {
          var data = {
            tags: view.tags,
            predicates: preds
          };
          res.json(data);
          res.end();
        });
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
      path: req.sitepath.toDottedPath()
    };
    res.expose(editData, 'formData');
    next();
  });

  page.viewRouter.routeAll('edit.html', selectTemplate.bind(page, 'edit', 'edit', null));
  page.viewRouter.routeAll('create.html', selectTemplate.bind(page, 'create', 'create', null));
  page.viewRouter.routeAll('tag.html', view.basicView.bind(page, 'tag', 'tag', null));
  page.viewRouter.routeAll('togglenavbar.cgi', view.basicView.bind(page, 'tag', 'tag', null));
}

exports = module.exports = BaseBehaviorMixin;
