var Conf = require ('../../lib/conf');
var test = require('tape');
var entity = require('../../lib/entity');
var sitepath = require ('../../lib/sitepath');
var query = require ('../../lib/query');

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
  t.deepEqual(tmp.text, 'SELECT count(*) FROM wh_entity WHERE (path <@ $1) ORDER BY path ASC');

  try {
    query._query_gen('wh','child','retr',{},undefined,undefined);
  } catch (err) {
    t.deepEqual(err.name,'InvalidQuery');
  }

  tmp = query._query_gen('wh','parents','count',{},undefined,undefined);
  t.deepEqual(tmp.text, 'SELECT count(*) FROM wh_entity WHERE (path @> $1) ORDER BY path ASC');

  tmp = query._query_gen('wh','dir','count',{},undefined,undefined);
  t.deepEqual(tmp.text, 'SELECT count(*) FROM wh_entity WHERE (path ~ \'$1.*{1}\') ORDER BY path ASC');

  tmp = query._query_gen('wh','child','count',{},undefined,undefined);
  t.deepEqual(tmp.text, 'SELECT count(*) FROM wh_entity WHERE (path <@ $1) ORDER BY path ASC');

  tmp = query._query_gen('wh','child','count',{protos: ['blah']},undefined,undefined);
  t.deepEqual(tmp.text, 'SELECT count(*) FROM wh_entity WHERE (path <@ $1) AND (proto = $2) ORDER BY path ASC');

  tmp = query._query_gen('wh','child','count',{notprotos: ['blah']},undefined,undefined);
  t.deepEqual(tmp.text, 'SELECT count(*) FROM wh_entity WHERE (path <@ $1) AND (proto <> $2) ORDER BY path ASC');

  tmp = query._query_gen('wh','child','count',{before: 123},undefined,undefined);
  t.deepEqual(tmp.text, 'SELECT count(*) FROM wh_entity WHERE (path <@ $1) AND (created < $2) ORDER BY path ASC');

  tmp = query._query_gen('wh','child','count',{after: 123},undefined,undefined);
  t.deepEqual(tmp.text, 'SELECT count(*) FROM wh_entity WHERE (path <@ $1) AND (created >= $2) ORDER BY path ASC');

  tmp = query._query_gen('wh','child','count',{},'changed',undefined);
  t.deepEqual(tmp.text, 'SELECT count(*) FROM wh_entity WHERE (path <@ $1) ORDER BY modified ASC');

  tmp = query._query_gen('wh','child','count',{},'created',undefined);
  t.deepEqual(tmp.text, 'SELECT count(*) FROM wh_entity WHERE (path <@ $1) ORDER BY created ASC');

  t.end();
});

test('query', function (t) {
  t.plan(5);

  select_query = "SELECT path, stub, entity_id, revision_id, revision_num, \
proto, modified, created, summary, data FROM wh_entity WHERE path = $1;";
  
  entpath = new sitepath(['wh','rq']);

  var Entclass = function() {};

  Entclass.prototype.from_db = function(queryresp) {
    t.pass('called from_db');
  };

  db = {};

  db.connect_wrap = function (queryfunc) {
    client = {};
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

test('query not_found', function (t) {
  t.plan(5);

  select_query = "SELECT path, stub, entity_id, revision_id, revision_num, \
proto, modified, created, summary, data FROM wh_entity WHERE path = $1;";
  
  entpath = new sitepath(['wh','rq']);

  var Entclass = function() {};

  Entclass.prototype.from_db = function(queryresp) {
    t.fail('should not try to call');
  };

  db = {};

  db.connect_wrap = function (queryfunc) {
    client = {};
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

test('query error', function (t) {
  t.plan(4);

  select_query = "SELECT path, stub, entity_id, revision_id, revision_num, \
proto, modified, created, summary, data FROM wh_entity WHERE path = $1;";
  
  entpath = new sitepath(['wh','rq']);

  var Entclass = function() {};

  Entclass.prototype.from_db = function(queryresp) {
    t.fail('should not try to call');
  };

  db = {};

  db.connect_wrap = function (queryfunc) {
    client = {};
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

test('query not_found log', function (t) {
  t.plan(4);

  select_query = "SELECT path, entity_id, note, base_revision_id, replace_revision_id, \
revision_id, revision_num, evt_start, evt_end, evt_touched, evt_class, evt_final, data \
FROM wh_log WHERE revision_id = $1;";

  entpath = new sitepath(['wh','rq']);

  var Entclass = function() {};

  Entclass.prototype.from_db = function(queryresp) {
    t.fail('should not try to call');
  };

  db = {};

  db.connect_wrap = function (queryfunc) {
    client = {};
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

test('query error log', function (t) {
  t.plan(4);

  select_query = "SELECT path, entity_id, note, base_revision_id, replace_revision_id, \
revision_id, revision_num, evt_start, evt_end, evt_touched, evt_class, evt_final, data \
FROM wh_log WHERE revision_id = $1;";
  
  entpath = new sitepath(['wh','rq']);

  var Entclass = function() {};

  Entclass.prototype.from_db = function(queryresp) {
    t.fail('should not try to call');
  };

  db = {};

  db.connect_wrap = function (queryfunc) {
    client = {};
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