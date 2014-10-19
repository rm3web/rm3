var Conf = require ('../../lib/conf');
var test = require('tape');
var entity = require('../../lib/entity');
var sitepath = require ('../../lib/sitepath');
var query = require ('../../lib/query');
var events = require("events");

test('query gen', function(t) {
  // tape throws is acting odd.
  try {
    query._query_gen('wh','retr','entity',{},undefined,undefined);
  } catch (err) {
    t.deepEqual(err.name,'InvalidQuery');
  }
  
  var tmp = query._query_gen('wh','child','entity',{},undefined,undefined);
  t.deepEqual(tmp.text, 'SELECT path, stub, entity_id, revision_id, revision_num, proto, modified, created, summary, data FROM wh_entity WHERE (path <@ $1) ORDER BY path ASC');

  tmp = query._query_gen('wh','child','count',{},undefined,undefined);
  t.deepEqual(tmp.text, 'SELECT count(*) FROM wh_entity WHERE (path <@ $1)');

  try {
    query._query_gen('wh','child','retr',{},undefined,undefined);
  } catch (err) {
    t.deepEqual(err.name,'InvalidQuery');
  }

  tmp = query._query_gen('wh','parents','count',{},undefined,undefined);
  t.deepEqual(tmp.text, 'SELECT count(*) FROM wh_entity WHERE (path @> $1)');

  tmp = query._query_gen('wh','dir','count',{},undefined,undefined);
  t.deepEqual(tmp.text, 'SELECT count(*) FROM wh_entity WHERE (path ~ lquery($1 || \'.*{1}\'))');

  tmp = query._query_gen('wh','child','count',{},undefined,undefined);
  t.deepEqual(tmp.text, 'SELECT count(*) FROM wh_entity WHERE (path <@ $1)');

  tmp = query._query_gen('wh','child','count',{protos: ['blah']},undefined,undefined);
  t.deepEqual(tmp.text, 'SELECT count(*) FROM wh_entity WHERE (path <@ $1) AND (proto = $2)');

  tmp = query._query_gen('wh','child','count',{notprotos: ['blah']},undefined,undefined);
  t.deepEqual(tmp.text, 'SELECT count(*) FROM wh_entity WHERE (path <@ $1) AND (proto <> $2)');

  tmp = query._query_gen('wh','child','count',{before: 123},undefined,undefined);
  t.deepEqual(tmp.text, 'SELECT count(*) FROM wh_entity WHERE (path <@ $1) AND (created < $2)');

  tmp = query._query_gen('wh','child','count',{after: 123},undefined,undefined);
  t.deepEqual(tmp.text, 'SELECT count(*) FROM wh_entity WHERE (path <@ $1) AND (created >= $2)');

  tmp = query._query_gen('wh','child','entity',{},'changed',undefined);
  t.deepEqual(tmp.text, 'SELECT path, stub, entity_id, revision_id, revision_num, proto, modified, created, summary, data FROM wh_entity WHERE (path <@ $1) ORDER BY modified ASC');

  tmp = query._query_gen('wh','child','entity',{},'created',undefined);
  t.deepEqual(tmp.text, 'SELECT path, stub, entity_id, revision_id, revision_num, proto, modified, created, summary, data FROM wh_entity WHERE (path <@ $1) ORDER BY created ASC');

  t.end();
});

test('query from_db', function (t) {
  t.plan(5);

  var select_query = "SELECT path, stub, entity_id, revision_id, revision_num, \
proto, modified, created, summary, data FROM wh_entity WHERE path = $1;";
  
  var entpath = new sitepath(['wh','rq']);

  var Entclass = function() {};

  Entclass.prototype.from_db = function(queryresp) {
    t.pass('called from_db');
  };

  var db = {};

  db.connect_wrap = function (queryfunc) {
    var client = {};
    client.query = function(spec, func) {
      t.pass('called query');
      t.deepEqual(spec.text, select_query);
      func(null, {rowCount: 1});
    };
    queryfunc(null, client, function()
      {
        t.pass('called done');
      });
  };

  query.entity_from_path(db, Entclass, entpath, null, function(err, entity){
    if(err) {
      t.fail(err);
    } else {
      t.pass('finished');
    }
    t.end();
  });
});

test('query from_db not_found', function (t) {
  t.plan(5);

  var select_query = "SELECT path, stub, entity_id, revision_id, revision_num, \
proto, modified, created, summary, data FROM wh_entity WHERE path = $1;";
  
  var entpath = new sitepath(['wh','rq']);

  var Entclass = function() {};

  Entclass.prototype.from_db = function(queryresp) {
    t.fail('should not try to call');
  };

  var db = {};

  db.connect_wrap = function (queryfunc) {
    var client = {};
    client.query = function(spec, func) {
      t.pass('called query');
      t.deepEqual(spec.text, select_query);
      func(null, {rowCount: 0});
    };
    queryfunc(null, client, function()
      {
        t.pass('called done');
      });
  };

  query.entity_from_path(db, Entclass, entpath, null, function(err, entity){
    if(err) {
      t.deepEqual(err.name,'EntityNotFoundError');
      t.deepEqual(err.path,entpath.toDottedPath());
    } else {
      t.fail('should not succeed');
    }
    t.end();
  });
});

test('query from_db error', function (t) {
  t.plan(4);

  var select_query = "SELECT path, stub, entity_id, revision_id, revision_num, \
proto, modified, created, summary, data FROM wh_entity WHERE path = $1;";
  
  var entpath = new sitepath(['wh','rq']);

  var Entclass = function() {};

  Entclass.prototype.from_db = function(queryresp) {
    t.fail('should not try to call');
  };

  var db = {};

  db.connect_wrap = function (queryfunc) {
    var client = {};
    client.query = function(spec, func) {
      t.pass('called query');
      t.deepEqual(spec.text, select_query);
      func(new Error("Connection was ended during query"));
    };
    queryfunc(null, client, function()
      {
        t.pass('called done');
      });
  };

  query.entity_from_path(db, Entclass, entpath, null, function(err, entity){
    if(err) {
      t.deepEqual(err.name,'QueryError');
    } else {
      t.fail('should not succeed');
    }
    t.end();
  });
});

test('query from_db not_found log', function (t) {
  t.plan(4);

  var select_query = "SELECT path, entity_id, note, base_revision_id, replace_revision_id, \
revision_id, revision_num, evt_start, evt_end, evt_touched, evt_class, evt_final, data \
FROM wh_log WHERE revision_id = $1;";

  var entpath = new sitepath(['wh','rq']);

  var Entclass = function() {};

  Entclass.prototype.from_db = function(queryresp) {
    t.fail('should not try to call');
  };

  var db = {};

  db.connect_wrap = function (queryfunc) {
    var client = {};
    client.query = function(spec, func) {
      t.pass('called query');
      t.deepEqual(spec.text, select_query);
      func(null, {rowCount: 0});
    };
    queryfunc(null, client, function()
      {
        t.pass('called done');
      });
  };

  query.entity_from_path(db, Entclass, entpath, '1234', function(err, entity){
    if(err) {
      t.deepEqual(err.name,'RevisionIdNotFoundError');
    } else {
      t.fail('should not succeed');
    }
    t.end();
  });
});

test('query from_db error log', function (t) {
  t.plan(4);

  var select_query = "SELECT path, entity_id, note, base_revision_id, replace_revision_id, \
revision_id, revision_num, evt_start, evt_end, evt_touched, evt_class, evt_final, data \
FROM wh_log WHERE revision_id = $1;";
  
  var entpath = new sitepath(['wh','rq']);

  var Entclass = function() {};

  Entclass.prototype.from_db = function(queryresp) {
    t.fail('should not try to call');
  };

  var db = {};

  db.connect_wrap = function (queryfunc) {
    var client = {};
    client.query = function(spec, func) {
      t.pass('called query');
      t.deepEqual(spec.text, select_query);
      func(new Error("Connection was ended during query"));
    };
    queryfunc(null, client, function()
      {
        t.pass('called done');
      });
  };

  query.entity_from_path(db, Entclass, entpath, '1535', function(err, entity){
    if(err) {
      t.deepEqual(err.name,'QueryError');
    } else {
      t.fail('should not succeed');
    }
    t.end();
  });
});

test('query', function (t) {
  t.plan(6);

  var select_query = 'SELECT path, stub, entity_id, revision_id, revision_num, proto, modified, created, summary, data FROM wh_entity WHERE (path <@ $1) ORDER BY path ASC';

  var entpath = new sitepath(['wh']);

  var db = {};

  var rec = { path: 'wh.query',
    stub: false,
    entity_id: 'f5f2e2e0-57cf-11e4-bca4-e7af6fd7ffe4',
    revision_id: 'f5f2e2e1-57cf-11e4-bca4-e7af6fd7ffe4',
    revision_num: 1,
    proto: 'base',
    modified: new Date(),
    created: new Date(),
    summary: { title: 'blrg', abstract: 'some text goes here' },
    data: { posting: '<div></div>' } };

  db.connect_wrap = function (queryfunc) {
    var client = {};
    client.query = function(spec) {
      t.pass('called query');
      t.deepEqual(spec.text, select_query);
      var ee = new events.EventEmitter();
      process.nextTick(function() {
        ee.emit('row', rec);
        ee.emit('end');
      });
      return ee;
    };
    queryfunc(null, client, function()
      {
        t.pass('called done');
      });
  };

  var resp = query.query(db, entpath,'child','entity',{},undefined,undefined);
  resp.on('article', function(article) {
    t.deepEqual(article.title, rec.summary.title);
    t.deepEqual(article.summary, rec.summary.abstract);
    t.deepEqual(article.guid, rec.entity_id);
  });
  resp.on('error', function(err) {
    t.fail(err);
  });
  resp.on('end', function() {
    t.end();
  });
});

test('query count', function (t) {
  t.plan(4);

  var select_query = 'SELECT count(*) FROM wh_entity WHERE (path <@ $1)';

  var entpath = new sitepath(['wh']);

  var db = {};

  var rec = { count: '2' };

  db.connect_wrap = function (queryfunc) {
    var client = {};
    client.query = function(spec) {
      t.pass('called query');
      t.deepEqual(spec.text, select_query);
      var ee = new events.EventEmitter();
      process.nextTick(function() {
        ee.emit('row', rec);
        ee.emit('end');
      });
      return ee;
    };
    queryfunc(null, client, function()
      {
        t.pass('called done');
      });
  };

  var resp = query.query(db, entpath,'child','count',{},undefined,undefined);
  resp.on('count', function(article) {
    t.deepEqual(article.count, '2');
  });
  resp.on('error', function(err) {
    t.fail(err);
  });
  resp.on('end', function() {
    t.end();
  });
});
