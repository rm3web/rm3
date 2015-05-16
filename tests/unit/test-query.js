var Conf = require ('../../lib/conf');
var entity = require('../../lib/entity');
var sitepath = require ('../../lib/sitepath');
var query = require ('../../lib/query');
var events = require("events");
var should = require('should');
var Plan = require('test-plan');

describe('query gen', function() {
  var root = {context: "ROOT"};

  describe('throws an error', function() {
    it('throws an error on invalid query select', function() {
      (function(){
        query._query_gen({}, 'wh','retr','entity',{},undefined,undefined);
      }).should.throw('invalid query');
    });
    it('throws an error on invalid query target', function() {
      (function(){
        query._query_gen(root, 'wh','child','retr',{},undefined,undefined);
      }).should.throw('invalid query');
    });
  });

  describe('generates the correct queries', function() {
    var tests = [
      {args: [root, 'wh','child','entity',{},undefined,undefined],
       expected: 'SELECT path, stub, hidden, entity_id, revision_id, revision_num, proto, modified, created, touched, summary, data, tags FROM wh_entity WHERE (wh_entity.path <@ $1) ORDER BY path ASC'},
      {args: [root, 'wh','child','count',{},undefined,undefined],
       expected: 'SELECT count(*) FROM wh_entity WHERE (wh_entity.path <@ $1)'},
      {args: [root, 'wh','parents','count',{},undefined,undefined],
       expected: 'SELECT count(*) FROM wh_entity WHERE (wh_entity.path @> $1)'},
      {args: [root, 'wh','dir','count',{},undefined,undefined],
       expected: 'SELECT count(*) FROM wh_entity WHERE (wh_entity.path ~ lquery($1 || \'.*{1}\'))'},
      {args: [root, 'wh','child','count',{},undefined,undefined],
       expected: 'SELECT count(*) FROM wh_entity WHERE (wh_entity.path <@ $1)'},
      {args: [root, 'wh','child','count',{protos: ['blah']},undefined,undefined],
       expected: 'SELECT count(*) FROM wh_entity WHERE (wh_entity.path <@ $1) AND (proto = $2)'},
      {args: [root, 'wh','child','count',{notprotos: ['blah']},undefined,undefined],
       expected: 'SELECT count(*) FROM wh_entity WHERE (wh_entity.path <@ $1) AND (proto <> $2)'},
      {args: [root, 'wh','child','count',{before: 123},undefined,undefined],
       expected: 'SELECT count(*) FROM wh_entity WHERE (wh_entity.path <@ $1) AND (created < $2)'},
      {args: [root, 'wh','child','count',{after: 123},undefined,undefined],
       expected: 'SELECT count(*) FROM wh_entity WHERE (wh_entity.path <@ $1) AND (created >= $2)'},
      {args: [root, 'wh','child','count',{navbar: true},undefined,undefined],
       expected: 'SELECT count(*) FROM wh_entity INNER JOIN wh_tag ON (wh_tag.subj_path = wh_entity.path) WHERE (wh_entity.path <@ $1) AND (pred_path = \'navigation\') AND (obj_str = \'navbar\')'},
      {args: [root, 'wh','child','count',{tag: 'bears'},undefined,undefined],
       expected: 'SELECT count(*) FROM wh_entity INNER JOIN wh_tag ON (wh_tag.subj_path = wh_entity.path) WHERE (wh_entity.path <@ $1) AND (pred_path = \'plain\') AND (obj_str = $2)'},
      {args: [root, 'wh','child','entity',{},'changed',undefined],
       expected: 'SELECT path, stub, hidden, entity_id, revision_id, revision_num, proto, modified, created, touched, summary, data, tags FROM wh_entity WHERE (wh_entity.path <@ $1) ORDER BY modified ASC'},
      {args: [root, 'wh','child','entity',{},'created',undefined],
       expected: 'SELECT path, stub, hidden, entity_id, revision_id, revision_num, proto, modified, created, touched, summary, data, tags FROM wh_entity WHERE (wh_entity.path <@ $1) ORDER BY created ASC'}
    ];
    
    tests.forEach(function(test, index) {
      // Need to name this better
      it('correctly builds ' + index, function() {
        var tmp = query._query_gen.apply(this, test.args);
        tmp.text.should.equal(test.expected);
      });
    });
  });
});

describe('query', function() {
  it('#entity_from_path()', function (done) {
    var plan = new Plan(2, done);
    
    var select_query = "SELECT path, stub, hidden, entity_id, revision_id, revision_num, proto, modified, created, touched, summary, data, tags FROM wh_entity WHERE (path = $1)";
    
    var entpath = new sitepath(['wh','rq']);

    var Entclass = function() {};

    Entclass.prototype.from_db = function(queryresp) {
    };

    var db = {};

    db.connectWrap = function (queryfunc) {
      var client = {};
      client.query = function(spec, func) {
        should.deepEqual(spec.text, select_query);
        func(null, {rowCount: 1});
      };
      queryfunc(null, client, function()
        {
          plan.ok(true);
        });
    };

    query.entity_from_path(db, Entclass, {context: "ROOT"}, entpath, null, function(err, entity){
      if(err) {
        should.fail(err);
      } else {
      }
      plan.ok(true);
    });
  });

  it('#fetch_effective_permissions()', function (done) {
    var plan = new Plan(2, done);
    var select_query = 'SELECT permission, wh_subject_to_roles.role FROM wh_permission_to_role INNER JOIN wh_subject_to_roles ON (wh_permission_to_role.role = wh_subject_to_roles.role) WHERE (subject = $1) AND (ltree(text($2)) ~ wh_permission_to_role.query)';
    
    var entpath = new sitepath(['wh']);
    var user = new sitepath(['wh','users','wirehead']);

    var db = {};

    db.connectWrap = function (queryfunc) {
      var client = {};
      client.query = function(spec, func) {
        should.deepEqual(spec.text, select_query);
        func(null, {rowCount: 1, rows: ['root']});
      };
      queryfunc(null, client, function()
        {
          plan.ok(true);
        });
    };

    query.fetch_effective_permissions(db, user, entpath, function(err, entity){
      if(err) {
        should.fail(err);
      } else {
      }
      plan.ok(true);
    });
  });

  it('query from_db not_found', function (done) {
    var plan = new Plan(2, done);
    var select_query = "SELECT path, stub, hidden, entity_id, revision_id, revision_num, proto, modified, created, touched, summary, data, tags FROM wh_entity WHERE (path = $1)";
    
    var entpath = new sitepath(['wh','rq']);

    var Entclass = function() {};

    Entclass.prototype.from_db = function(queryresp) {
      should.fail('should not try to call');
    };

    var db = {};

    db.connectWrap = function (queryfunc) {
      var client = {};
      client.query = function(spec, func) {
        should.deepEqual(spec.text, select_query);
        func(null, {rowCount: 0});
      };
      queryfunc(null, client, function()
        {
          plan.ok(true);
        });
    };

    query.entity_from_path(db, Entclass, {context: "ROOT"}, entpath, null, function(err, entity){
      if(err) {
        should.deepEqual(err.name,'EntityNotFoundError');
        should.deepEqual(err.path,entpath.toDottedPath());
      } else {
        should.fail('should not succeed');
      }
      plan.ok(true);
    });
  });

  it('query from_db error', function (done) {
    var plan = new Plan(2, done);
    var select_query = "SELECT path, stub, hidden, entity_id, revision_id, revision_num, proto, modified, created, touched, summary, data, tags FROM wh_entity WHERE (path = $1)";
    
    var entpath = new sitepath(['wh','rq']);

    var Entclass = function() {};

    Entclass.prototype.from_db = function(queryresp) {
      should.fail('should not try to call');
    };

    var db = {};

    db.connectWrap = function (queryfunc) {
      var client = {};
      client.query = function(spec, func) {
        should.deepEqual(spec.text, select_query);
        func(new Error("Connection was ended during query"));
      };
      queryfunc(null, client, function()
        {
          plan.ok(true);
        });
    };

    query.entity_from_path(db, Entclass, {context: "ROOT"}, entpath, null, function(err, entity){
      if(err) {
        should.deepEqual(err.name,'QueryError');
      } else {
        should.fail('should not succeed');
      }
      plan.ok(true);
    });
  });

  it('query from_db not_found log', function (done) {
    var plan = new Plan(2, done);
    var select_query = "SELECT path, entity_id, note, base_revision_id, replace_revision_id, \
revision_id, revision_num, evt_start, evt_end, evt_touched, evt_class, evt_final, data \
FROM wh_log WHERE (revision_id = $1)";

    var entpath = new sitepath(['wh','rq']);

    var Entclass = function() {};

    Entclass.prototype.from_db = function(queryresp) {
      should.fail('should not try to call');
    };

    var db = {};

    db.connectWrap = function (queryfunc) {
      var client = {};
      client.query = function(spec, func) {
        should.deepEqual(spec.text, select_query);
        func(null, {rowCount: 0});
      };
      queryfunc(null, client, function()
        {
          plan.ok(true);
        });
    };

    query.entity_from_path(db, Entclass, {context: "ROOT"}, entpath, '1234', function(err, entity){
      if(err) {
        should.deepEqual(err.name,'RevisionIdNotFoundError');
      } else {
        should.fail('should not succeed');
      }
      plan.ok(true);
    });
  });

  it('query from_db error log', function (done) {
    var plan = new Plan(2, done);
    var select_query = "SELECT path, entity_id, note, base_revision_id, replace_revision_id, \
revision_id, revision_num, evt_start, evt_end, evt_touched, evt_class, evt_final, data \
FROM wh_log WHERE (revision_id = $1)";
    
    var entpath = new sitepath(['wh','rq']);

    var Entclass = function() {};

    Entclass.prototype.from_db = function(queryresp) {
      should.fail('should not try to call');
    };

    var db = {};

    db.connectWrap = function (queryfunc) {
      var client = {};
      client.query = function(spec, func) {
        should.deepEqual(spec.text, select_query);
        func(new Error("Connection was ended during query"));
      };
      queryfunc(null, client, function()
        {
          plan.ok(true);
        });
    };

    query.entity_from_path(db, Entclass, {context: "ROOT"}, entpath, '1535', function(err, entity){
      if(err) {
        should.deepEqual(err.name,'QueryError');
      } else {
        should.fail('should not succeed');
      }
      plan.ok(true);
    });
  });

  it('query', function (done) {
    var plan = new Plan(3, done);
    var select_query = 'SELECT path, stub, hidden, entity_id, revision_id, revision_num, proto, modified, created, touched, summary, data, tags FROM wh_entity WHERE (wh_entity.path <@ $1) ORDER BY path ASC';

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

    db.connectWrap = function (queryfunc) {
      var client = {};
      client.query = function(spec) {
        should.deepEqual(spec.text, select_query);
        var ee = new events.EventEmitter();
        process.nextTick(function() {
          ee.emit('row', rec);
          ee.emit('end');
        });
        return ee;
      };
      queryfunc(null, client, function()
        {
          plan.ok(true);
        });
    };

    var root = {context: "ROOT"};

    var resp = query.query(db, root, entpath, 'child','entity',{},undefined,undefined);
    resp.on('article', function(article) {
      should.deepEqual(article.title, rec.summary.title);
      should.deepEqual(article.summary, rec.summary.abstract);
      should.deepEqual(article.guid, rec.entity_id);
      plan.ok(true);
    });
    resp.on('error', function(err) {
      should.fail(err);
    });
    resp.on('end', function() {
      plan.ok(true);
    });
  });

  it('query count', function (done) {
    var plan = new Plan(3, done);
    var select_query = 'SELECT count(*) FROM wh_entity WHERE (wh_entity.path <@ $1)';

    var entpath = new sitepath(['wh']);

    var db = {};

    var rec = { count: '2' };

    db.connectWrap = function (queryfunc) {
      var client = {};
      client.query = function(spec) {
        should.deepEqual(spec.text, select_query);
        var ee = new events.EventEmitter();
        process.nextTick(function() {
          ee.emit('row', rec);
          ee.emit('end');
        });
        return ee;
      };
      queryfunc(null, client, function()
        {
          plan.ok(true);
        });
    };

    var root = {context: "ROOT"};

    var resp = query.query(db, root, entpath, 'child','count',{},undefined,undefined);
    resp.on('count', function(article) {
      should.deepEqual(article.count, '2');
      plan.ok(true);
    });
    resp.on('error', function(err) {
      should.fail(err);
    });
    resp.on('end', function() {
      plan.ok(true);
    });
  });

  it('query_history', function (done) {
    var plan = new Plan(3, done);
    var select_query = 'SELECT path, entity_id, note, base_revision_id, \
replace_revision_id, revision_id, revision_num, evt_start, evt_end, \
evt_touched, evt_class, evt_final, data FROM wh_log WHERE (path = $1) ORDER BY revision_num ASC';

    var entpath = new sitepath(['wh']);

    var db = {};

    var rec = { entity_id: 'f5f2e2e0-57cf-11e4-bca4-e7af6fd7ffe4',
            note: 'test',
            base_revision_id: 'f5f2e2e0-57cf-11e4-bca4-e7af6fd7ffe4',
            replace_revision_id: 'f5f2e2e0-57cf-11e4-bca4-e7af6fd7ffe4',
            revision_id: 'f5f2e2e0-57cf-11e4-bca4-e7af6fd7ffe4',
            revision_num: 1,
            evt_start: new Date(),
            evt_end: new Date(),
            evt_touched: new Date(),
            evt_class: 'test',
            evt_final: true,
            data: {}};

    db.connectWrap = function (queryfunc) {
      var client = {};
      client.query = function(spec) {
        should.deepEqual(spec.text, select_query);
        var ee = new events.EventEmitter();
        process.nextTick(function() {
          ee.emit('row', rec);
          ee.emit('end');
        });
        return ee;
      };
      queryfunc(null, client, function()
        {
          plan.ok(true);
        });
    };

    var resp = query.query_history(db, {}, entpath);
    resp.on('article', function(article) {
      should.deepEqual(article.note, rec.note);
      should.deepEqual(article.data, rec.data);
      should.deepEqual(article.revision_id, rec.revision_id);
      plan.ok(true);
    });
    resp.on('error', function(err) {
      should.fail(err);
    });
    resp.on('end', function() {
      plan.ok(true);
    });
  });
});
