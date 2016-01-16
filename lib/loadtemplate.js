var async = require('async');
var validator = require('validator');
var SitePath = require('sitepath');
var textblocks = require('textblocks');

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
  'predicate': function createPredicate(db, Entity, update, item, root, next) {
    var entity = new Entity();
    var now = new Date();
    entity.createNew(root.down(item.path), 'predicate', now);
    entity.summary.title = item.title;
    entity.summary.abstract = item.abstract;
    doCreate(db, update, entity, next);
  },
  'page': function createPage(db, Entity, update, item, root, next) {
    var entity = new Entity();
    var now = new Date();
    entity.createNew(root.down(item.path), item.proto, now);
    entity.data.posting = textblocks.makeTextBlock(item.posting, 'markdown');
    entity.summary.title = item.title;
    entity.summary.abstract = item.abstract;
    doCreate(db, update, entity, next);
  }
};

function loadTemplate(db, Entity, update, data, root, next) {
  async.each(data, function(item, next) {
    if (templates.hasOwnProperty(item.type)) {
      templates[item.type](db, Entity, update, item, root, next);
    }
  }, next);
}

exports = module.exports = loadTemplate;
