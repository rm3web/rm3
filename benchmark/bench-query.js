var Conf = require ('../lib/conf');
var entity = require('../lib/entity');
var sitepath = require ('sitepath');
var update = require('../lib/update');
var query = require('../lib/query');
var db = require('../lib/db');
var user = require('../lib/user');
var async = require('async');
var resources = require('../tests/lib/resources.js');
var makeFakeEntity = require('../tests/lib/fakedata').makeFakeEntity;

var redisModule = require('cache-service-redis');
var cs = require('cache-service');
var redisCache = new redisModule({redisUrl: Conf.getEndpoint('cacheRedis')});
var cacheService = new cs({}, [redisCache]);

var winston = require('winston');

winston.remove(winston.transports.Console);

suite('query#entityFromPath', function() {
  var MockEntclass = function() {};

  MockEntclass.prototype.fromDb = function(queryresp) {
  };

  MockEntclass.prototype.fromLog = function(queryresp) {
  };

  var mockdb = {};

  mockdb.connectWrap = function(queryfunc) {
    var client = {};
    client.query = function(spec, func) {
      func(null, {rowCount: 1, rows: [{stub:false}]});
    };
    queryfunc(null, client, function() {
    });
  };

  var ents = {};

  var path = new sitepath(['wh','perf_entity_from_path']);
  var now = new Date();

  resources.entityResource(path, ents, 'one', false, now);
  before(function(done) {    
    async.times(10, function(n, next) {
      makeFakeEntity(path, next);
    }, done);
  });

  bench('root access', function(done) {
    query.entityFromPath(db, false, entity.Entity, {}, {context: "ROOT"}, path, null, function(err, ent2){
      done(err);
    });
  });

  bench('root access cached', function(done) {
    query.entityFromPath(db, cacheService, entity.Entity, {}, {context: "ROOT"}, path, null, function(err, ent2){
      done(err);
    });
  });


  bench('root access minus db', function(done) {
    query.entityFromPath(mockdb, false, MockEntclass, {}, {context: "ROOT"}, path, null, function(err, ent2) {
      done(err);
    });
  });

  bench('root access by revisionId', function(done) {
    query.entityFromPath(db, false, entity.Entity, {}, {context: "ROOT"}, path,
                         ents.one._entityId, function(err, ent2){
      done(err);
    });
  });

  bench('root access by revisionId minus db', function(done) {
    query.entityFromPath(mockdb, false, MockEntclass, {}, {context: "ROOT"}, path, 
                         ents.one._entityId, function(err, ent2){
      done(err);
    });
  });


  bench('nobody access', function(done) {
    query.entityFromPath(db, false, entity.Entity, {}, {context: "STANDARD"}, path, null, function(err, ent2){
      done();
    });
  });

  bench('nobody access cached', function(done) {
    query.entityFromPath(db, cacheService, entity.Entity, {}, {context: "STANDARD"}, path, null, function(err, ent2){
      done();
    });
  });

  bench('nobody access minus db', function(done) {
    query.entityFromPath(mockdb, false, MockEntclass, {}, {context: "STANDARD"}, path, null, function(err, ent2) {
      done(err);
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
    var resp = query.query(db, {}, {context: "ROOT"}, path1, 'child','entity',{},undefined,undefined,{});
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
    var resp = query.query(db, {}, {context: "ROOT"}, path1, 'child','entity',{navbar: true},undefined,undefined,{});
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
    update.updateEntity(db, {}, {context: "ROOT"}, ents.one, ents.updated, true, false, 'update',
      function(err, entityId, revisionId, revisionNum) {
        ents.updated._entityId = entityId;
        ents.updated._revisionId = revisionId;
        ents.updated._revisionNum = revisionNum;
        done(err);
      }
    );
  });

  bench('query', function(done){
    var resp = query.queryHistory(db, {}, {}, path, null, {});
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
