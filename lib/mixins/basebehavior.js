var update = require ('../update'),
    logging = require('../logging'),
    authorize = require('../authorize'),
    PageForm = require('../forms/page.js'),
    validator = require('validator'),
    textblocks = require('textblocks'),
    toSlug = require('../toslug'),
    formlib = require('../formlib'),
    sanitize = require('../sanitize'),
    view = require('../view'),
    async = require('async'),
    query = require('../query');

var boundLogger = logging.getRootLogger('mixins.basebehavior');

function fetchPopularTags(query, req, next) {
  var resp = query.query(req.db, req.ctx, req.access,
    req.site.root, 'child', 'count', {},
    undefined, {on: 'tag', objClass: 'tag'}, {limit: 50});
  var popTags = [];

  resp.on('count', function(article) {
    popTags.push(article.facet);
  });
  resp.on('error', function(err) {
    next(err);
  });
  resp.on('end', function() {
    next(undefined, popTags);
  });
}

function fetchOntags(query, req, next) {
  var resp = query.query(req.db, req.ctx, req.access,
    req.site.root, 'child', 'entity', {'ontags': true},
    undefined, undefined, {});
  var ontags = [];

  resp.on('article', function(article) {
    ontags.push({
      'id': article.path.toDottedPath(),
      'name': article.summary.title});
  });
  resp.on('error', function(err) {
    next(err);
  });
  resp.on('end', function() {
    next(undefined, ontags);
  });
}

function fetchPreds(query, req, next) {
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
      'metadataClass': article.path.up().leaf()});
  });
  resp.on('error', function(err) {
    next(err);
  });
  resp.on('end', function() {
    next(undefined, preds);
  });
}

function selectTemplate(section, template, req, res, next) {
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
  view.basicView(section, tmp, req, res, next);
}

function validateForm(update, body, next) {
  var pageForm = new PageForm(update);
  pageForm.checkForm(body, next);
}

function doStandardEdit(oldent, now, req, res, next) {
  var saveAsDraft = validator.toBoolean(req.body.saveAsDraft);
  var minorChange = validator.toBoolean(req.body.minorChange);
  var sameRevision = false;
  if (req.entity.curLogRev) {
    var isDraft = !req.entity.curLogRev.evtFinal;
    if (isDraft && saveAsDraft) {
      sameRevision = !validator.toBoolean(req.body.createNewDraft);
    }
  }
  req.entity.data.posting = textblocks.validateTextBlock(req.body.posting, {site: req.site});
  req.entity.summary.title = req.body.title;
  req.entity.summary.abstract = sanitize.sanitizeXML(req.body.abstract);
  req.entity.data.excludeChildrenDisplay = req.body.excludeChildrenDisplay;
  req.entity.fullTextString = textblocks.extractTextBlockText(req.entity.data.posting);
  if (minorChange) {
    req.entity.updateTouched(now);
  } else {
    req.entity.updateTimes(now);
  }
  update.updateEntity(req.db, req.ctx, req.access, oldent, req.entity, !saveAsDraft, sameRevision, req.body.memo,
  function(err, entityId, revisionId, revisionNum) {
    if (err) {
      return next(err);
    } else {
      if (saveAsDraft) {
        return res.redirect(req.site.sitePathToUrl(req.entity.path(), revisionId));
      } else {
        return res.redirect(req.site.sitePathToUrl(req.entity.path()));
      }
    }
  });
}

function doStandardEditExpose(editData, req, res, next) {
  formlib.copyViaDottedPath(editData, req.entity, PageForm.formToEntity);
  res.serverVars.bundle = "bundles/page.js";
  res.serverVars.component = "page.jsx";
  next(null, editData);
}

function doStandardCreateExpose(editData, req, res, next) {
  res.serverVars.bundle = "bundles/page.js";
  res.serverVars.component = "page.jsx";
  next(null, editData);
}

function doStandardCreate(now, req, res, next) {
  var saveAsDraft = validator.toBoolean(req.body.saveAsDraft);
  if (validator.toBoolean(req.body.autogenSlug)) {
    var slug = toSlug(req.body.title);
    req.entity.createNew(req.sitepath.down(slug), req.page.proto, now);
  } else {
    req.entity.createNew(req.sitepath.down(req.body.leaf), req.page.proto, now);
  }
  req.entity.data.posting = textblocks.validateTextBlock(req.body.posting, {site: req.site});
  req.entity.data.excludeChildrenDisplay = req.body.excludeChildrenDisplay;
  req.entity.summary.title = req.body.title;
  req.entity.summary.abstract = sanitize.sanitizeXML(req.body.abstract);
  req.entity.fullTextString = textblocks.extractTextBlockText(req.entity.data.posting);
  update.createEntity(req.db, req.ctx, req.access, req.entity, !saveAsDraft, req.body.memo,
  function(err, entityId, revisionId, revisionNum) {
    if (err) {
      return next(err);
    } else {
      if (saveAsDraft) {
        return res.redirect(req.site.sitePathToUrl(req.entity.path(), revisionId));
      } else {
        return res.redirect(req.site.sitePathToUrl(req.entity.path()));
      }
    }
  });
}

function BaseBehaviorMixin(page) {
  page.securityRouter.get('', authorize({permission: 'view'}));
  page.securityRouter.get('atom.xml', authorize({permission: 'view'}));
  page.securityRouter.post('edit.html', authorize({requiresAuth: true, permission: 'edit'}));
  page.securityRouter.get('edit.html', authorize({requiresAuth: true, permission: 'edit'}));
  page.securityRouter.post('publish.html', authorize({requiresAuth: true, permission: 'edit'}));
  page.securityRouter.get('create.html', authorize({requiresAuth: true, effectivePermission: 'edit'}));
  page.securityRouter.post('create.html', authorize({requiresAuth: true, effectivePermission: 'edit'}));
  page.securityRouter.post('tag.html', authorize({requiresAuth: true, effectivePermission: 'edit'}));
  page.securityRouter.get('tag.html', authorize({requiresAuth: true, effectivePermission: 'edit'}));
  page.securityRouter.get('tags.cgi', authorize({permission: 'view'}));
  page.securityRouter.put('tags.cgi', authorize({requiresAuth: true, effectivePermission: 'edit'}));
  page.securityRouter.post('togglenavbar.cgi', authorize({requiresAuth: true, effectivePermission: 'edit'}));
  page.securityRouter.post('togglehidden.cgi', authorize({requiresAuth: true, effectivePermission: 'edit'}));
  page.securityRouter.get('tree.html', authorize({requiresAuth: true, permission: 'view'}));

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
    update.updateEntity(req.db, req.ctx, req.access, oldent, req.entity, true, false, 'toggle navbar', function(err) {
      res.status(200);
      res.json({navbar: navbar});
      return res.end();
    });
  });

  page.commandRouter.post('togglehidden.cgi', function(req, res, next) {
    var oldent = req.entity.clone();
    req.entity._hidden = !req.entity._hidden;
    update.updateEntity(req.db, req.ctx, req.access, oldent, req.entity, true, false, 'toggle hidden', function(err) {
      res.status(200);
      res.json({hidden: req.entity._hidden});
      return res.end();
    });
  });

  page.commandRouter.put('tags.cgi', function(req, res, next) {
    var oldent = req.entity.clone();
    var oldRevisionId = req.entity._revisionId;
    console.log(req.body);
    if (req.body.hasOwnProperty('tags')) {
      req.entity.tagsFromJSON(req.body.tags);
      update.updateEntity(req.db, req.ctx, req.access, oldent, req.entity, true, false, 'edit tags', function(err, entityId, revisionId, revisionNum) {
        if (err) {
          return next(err);
        }
        if (page.postAlterFunc) {
          page.postAlterFunc(revisionId, oldRevisionId, req, res, next);
        } else {
          next(err);
        }
      });
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
    req.entity.data.posting = textblocks.makeTextBlock('', 'html', {site: req.site});
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
        async.parallel([
          fetchPreds.bind(this, query, req),
          fetchOntags.bind(this, query, req),
          fetchPopularTags.bind(this, query, req)
        ], function(err, results) {
          if (err) {
            return next(err);
          }
          var data = {
            tags: view.tags,
            predicates: results[0],
            ontags: results[1],
            popularTags: results[2]
          };
          res.json(data);
          res.end();
        });
      }
    });
  });

  page.freshnessRouter.get('edit.html', view.noCacheView);
  page.freshnessRouter.get('create.html', view.noCacheView);

  page.viewRouter.routeAll('edit.html', function(req, res, next) {
    var exposeFunc = doStandardEditExpose;
    var editData = {
      path: req.sitepath.toDottedPath()
    };
    res.expose({}, 'errors');
    if (page.exposeFunc) {
      exposeFunc = page.exposeFunc;
    }
    exposeFunc(editData, req, res, function(err, editData) {
      if (err) {
        next(err);
      }
      res.expose(editData, 'formData');
      res.serverVars.formData = editData;
      next(err);
    });
  });

  page.viewRouter.routeAll('create.html', function(req, res, next) {
    var editData = {
      path: req.sitepath.toDottedPath()
    };
    var exposeCreateFunc = doStandardCreateExpose;
    if (page.exposeCreateFunc) {
      exposeCreateFunc = page.exposeCreateFunc;
    }
    res.expose({}, 'errors');
    exposeCreateFunc(editData, req, res, function(err, editData) {
      if (err) {
        next(err);
      }
      res.expose(editData, 'formData');
      res.serverVars.formData = editData;
      next(err);
    });
  });

  page.viewRouter.get('atom.xml', function(req, res, next) {
    res.forceResponseType = 'application/atom+xml';
    next();
  });

  page.viewRouter.routeAll('edit.html', selectTemplate.bind(page, 'edit', 'edit'));
  page.viewRouter.routeAll('create.html', selectTemplate.bind(page, 'create', 'create'));
  page.viewRouter.routeAll('tag.html', view.basicView.bind(page, 'tag', 'tag'));
  page.viewRouter.routeAll('togglenavbar.cgi', view.basicView.bind(page, 'tag', 'tag'));
  page.viewRouter.get('atom.xml', view.basicView.bind(page, 'atom', 'atom'));
  page.viewRouter.get('tree.html', view.basicView.bind(page, 'tree', 'tree'));
}

exports = module.exports = BaseBehaviorMixin;
