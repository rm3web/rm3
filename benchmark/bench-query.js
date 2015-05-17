var Conf = require ('../lib/conf');
var entity = require('../lib/entity');
var sitepath = require ('../lib/sitepath');
var update = require('../lib/update');
var query = require('../lib/query');
var db = require('../lib/db');
var user = require('../lib/user');
var resources = require('../tests/lib/resources.js');

suite('query#entity_from_path', function() {
  var ents = {};

  var path = new sitepath(['wh','perf_entity_from_path']);
  var now = new Date();

  resources.entityResource(path, ents, 'one', false, now);

  bench('simple query', function(done) {
    query.entityFromPath(db, entity.Entity, {context: "ROOT"}, path, null, function(err, ent2){

      done();
    });
  });
});


suite('query#query', function () {
  var ents = {};

  var path1 = new sitepath(['wh','query']);
  var path2 = new sitepath(['wh','query','sub']);
  var now = new Date();

  resources.entityResource(path1, ents, 'one', false, now, function(e){
    e.addTag('navigation','navbar');
  });

  resources.entityResource(path2, ents, 'two', false, now, function(e){
    e.addTag(null,'navbar');
  });

  bench('simple query', function(done) {
    var resp = query.query(db, {context: "ROOT"}, path1, 'child','entity',{},undefined,undefined);
    var arts = [];
    resp.on('article', function(article) {
      arts.push(article);
    });
    resp.on('error', function(err) {
      done(err);
    });
    resp.on('end', function() {
      done();
    });
  });

  bench('navbar', function(done) {
    var resp = query.query(db, {context: "ROOT"}, path1, 'child','entity',{navbar: true},undefined,undefined);
    var arts = [];
    resp.on('article', function(article) {
      arts.push(article);
    });
    resp.on('error', function(err) {
      done(err);
    });
    resp.on('end', function() {
      done();
    });
  });
});

suite("query#query_history", function() {
  var ents = {};

  var path = new sitepath(['wh','query_history']);
  var now = new Date();

  resources.entityResource(path, ents, 'one', false, now);

  before(function(done) {
    ents.updated = ents.one.clone();
    ents.updated.data.posting = "<div>blah blah blah</div>";
    ents.updated.summary.title = 'updated';
    update.updateEntity(db, ents.one, ents.updated, true, 'update',
      function(err, entityId, revisionId, revisionNum) {
        ents.updated._entityId = entityId;
        ents.updated._revisionId = revisionId;
        ents.updated._revisionNum = revisionNum;
        done(err);
      }
    );
  });

  bench('query', function(done){
    var resp = query.queryHistory(db, {}, path);
    var arts = [];
    resp.on('article', function(article) {
      arts.push(article);
    });
    resp.on('error', function(err) {
      done(err);
    });
    resp.on('end', function() {
      done();
    });      
  });
});
