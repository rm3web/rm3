var async = require('async');
var validator = require('validator');
var SitePath = require('sitepath');
var textblocks = require('textblocks');
var user = require('./authentication/user');
var crypto = require('crypto');

var logging = require('./logging');
var boundLogger = logging.getRootLogger('loadTemplate');

function doCreate(db, update, entity, next) {
  update.createEntity(db, {}, {context: 'ROOT'}, entity, true, 'load template',
    function(err, entityId, revisionId, revisionNum) {
      if (!err) {
        boundLogger.info('doCreate done', {path: entity.path(), entityId: entityId, revisionId: revisionId, revisionNum: revisionNum});
      }
      next(err);
    });
}

var templates = {
  'predicate': function createPredicate(db, Entity, update, item, root, userRoot, next) {
    var entity = new Entity();
    var now = new Date();
    entity.createNew(root.down(item.path), 'predicate', now);
    entity.summary.title = item.title;
    entity.summary.abstract = item.abstract;
    if (item.uri) {
      entity.summary.uri = item.uri;
    }
    entity.addTag("navigation", "predicate");
    doCreate(db, update, entity, next);
  },
  'page': function createPage(db, Entity, update, item, root, userRoot, next) {
    var entity = new Entity();
    var now = new Date();
    entity.createNew(root.down(item.path), item.proto, now);
    entity.data.posting = textblocks.makeTextBlock(item.posting, 'markdown');
    entity.summary.title = item.title;
    entity.summary.abstract = item.abstract;
    doCreate(db, update, entity, next);
  },
  'index': function createPage(db, Entity, update, item, root, userRoot, next) {
    var entity = new Entity();
    var now = new Date();
    entity.createNew(root.down(item.path), item.proto, now);
    var block = {
      "blocks":[
        textblocks.makeTextBlock(item.posting, 'markdown'),
        {"format":"indexfeed","query":"dir","sort":"path","partial":"list"}],
      "format":"section"};
    entity.data.posting = block;
    entity.summary.title = item.title;
    entity.summary.abstract = item.abstract;
    doCreate(db, update, entity, next);
  },
  'user': function createUser(db, Entity, update, item, root, userRoot, next) {
    var entity = new Entity();
    var now = new Date();
    user.createUser(entity, userRoot, item.name, item.fullName, now);
    entity.summary.abstract = item.profile || '';
    if (item.profileUrl) {
      entity.summary.profileUrl = item.profileUrl;
    }
    if (item.email) {
      entity.data.email = item.email;
    }
    var pw;
    if (item.password) {
      pw = item.password;
    } else {
      var buf = crypto.randomBytes(6);
      pw = buf.toString('base64');
    }
    doCreate(db, update, entity, function(err) {
      user.createCredential(db, {}, item.email, userRoot, item.name, pw, function(err) {
        next(err);
      });
    });
  },
  'assign': function assignUserToRole(db, Entity, update, item, root, userRoot, next) {
    update.assignUserToRole(db, {}, {context: 'ROOT'}, userRoot.down(item.user),
      item.role, 'load template', function(err, entityId, revisionId, revisionNum) {
        if (err) {
          boundLogger.error('error:', err);
          return next(err);
        }
        next();
      });
  },
  'permit': function addPermissionToRole(db, Entity, update, item, root, userRoot, next) {
    update.addPermissionToRole(db, {}, {context: 'ROOT'}, item.role,
      item.permission, item.path, 'load template', function(err, entityId, revisionId, revisionNum) {
        if (err) {
          boundLogger.error('error:', err);
          return next(err);
        }
        next();
      });
  }
};

function loadTemplate(db, Entity, update, data, root, userRoot, ignoreTemplates, next) {
  async.eachSeries(data, function(item, next) {
    if (templates.hasOwnProperty(item.type)) {
      if (ignoreTemplates[item.type]) {
        return next();
      }
      templates[item.type](db, Entity, update, item, root, userRoot,next);
    }
  }, next);
}

exports = module.exports = loadTemplate;
