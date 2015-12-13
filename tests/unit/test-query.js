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
      (function() {
        query._queryGen({}, 'wh', 'retr', 'entity', {}, undefined, undefined, {});
      }).should.throw('invalid query');
    });
    it('throws an error on invalid query target', function() {
      (function() {
        query._queryGen(root, 'wh', 'child', 'retr', {}, undefined, undefined, {});
      }).should.throw('invalid query');
    });
  });

  describe('generates the correct queries', function() {
    var tests = [
      {args: [root, 'wh', 'child', 'entity', {}, undefined, undefined, {}],
       expected: 'SELECT path, stub, hidden, "entityId", "revisionId", "revisionNum", proto, modified, created, touched, summary, data, tags FROM wh_entity WHERE (wh_entity.path <@ $1) ORDER BY path ASC, "entityId" ASC'},
      {args: [root, 'wh', 'child', 'count', {}, undefined, undefined, {}],
       expected: 'SELECT count(*) FROM wh_entity WHERE (wh_entity.path <@ $1)'},
      {args: [root, 'wh', 'parents', 'count', {}, undefined, undefined, {}],
       expected: 'SELECT count(*) FROM wh_entity WHERE (wh_entity.path @> $1)'},
      {args: [root, 'wh', 'dir', 'count', {}, undefined, undefined, {}],
       expected: 'SELECT count(*) FROM wh_entity WHERE (wh_entity.path ~ lquery($1 || \'.*{1}\'))'},
      {args: [root, 'wh', 'child', 'count', {}, undefined, undefined, {}],
       expected: 'SELECT count(*) FROM wh_entity WHERE (wh_entity.path <@ $1)'},
      {args: [root, 'wh', 'child', 'count', {protos: ['blah']}, undefined, undefined, {}],
       expected: 'SELECT count(*) FROM wh_entity WHERE (wh_entity.path <@ $1) AND (proto = $2)'},
      {args: [root, 'wh', 'child', 'count', {notprotos: ['blah']}, undefined, undefined, {}],
       expected: 'SELECT count(*) FROM wh_entity WHERE (wh_entity.path <@ $1) AND (proto <> $2)'},
      {args: [root, 'wh', 'child', 'count', {before: 123}, undefined, undefined, {}],
       expected: 'SELECT count(*) FROM wh_entity WHERE (wh_entity.path <@ $1) AND (created < $2)'},
      {args: [root, 'wh', 'child', 'count', {after: 123}, undefined, undefined, {}],
       expected: 'SELECT count(*) FROM wh_entity WHERE (wh_entity.path <@ $1) AND (created >= $2)'},
      {args: [root, 'wh', 'child', 'count', {navbar: true}, undefined, undefined, {}],
       expected: 'SELECT count(*) FROM wh_entity INNER JOIN wh_tag ON (wh_tag."subjPath" = wh_entity.path) WHERE (wh_entity.path <@ $1) AND ("predPath" = \'navigation\' AND "objStr" = \'navbar\')'},
      {args: [root, 'wh', 'child', 'count', {comment: true}, undefined, undefined, {}],
       expected: 'SELECT count(*), actor.proto AS "actorProto", actor.summary AS "actorSummary" FROM wh_entity INNER JOIN wh_tag ON (wh_tag."subjPath" = wh_entity.path) LEFT JOIN wh_entity actor ON (ltree(wh_entity.summary->>\'author\') = actor.path) WHERE (wh_entity.path <@ $1) AND ("predPath" = \'navigation\' AND "objStr" = \'comment\')'},
      {args: [root, 'wh', 'child', 'count', {tag: 'bears'}, undefined, undefined, {}],
       expected: 'SELECT count(*) FROM wh_entity INNER JOIN wh_tag ON (wh_tag."subjPath" = wh_entity.path) WHERE (wh_entity.path <@ $1) AND ("predPath" = \'plain\' AND "objStr" = $2)'},
      {args: [root, 'wh', 'child', 'entity', {}, 'changed', undefined, {}],
       expected: 'SELECT path, stub, hidden, "entityId", "revisionId", "revisionNum", proto, modified, created, touched, summary, data, tags FROM wh_entity WHERE (wh_entity.path <@ $1) ORDER BY modified ASC, "entityId" ASC'},
      {args: [root, 'wh', 'child', 'entity', {}, 'created', undefined, {}],
       expected: 'SELECT path, stub, hidden, "entityId", "revisionId", "revisionNum", proto, modified, created, touched, summary, data, tags FROM wh_entity WHERE (wh_entity.path <@ $1) ORDER BY created ASC, "entityId" ASC'},
      {args: [root, 'wh', 'child', 'entity', {}, undefined, undefined, {token: new sitepath(['wh','errr']), entityId: '2355', start: 12, limit: 12}],
       expected: 'SELECT path, stub, hidden, "entityId", "revisionId", "revisionNum", proto, modified, created, touched, summary, data, tags FROM wh_entity WHERE (wh_entity.path <@ $1) AND ((wh_entity."path", wh_entity."entityId") > ($2,$3)) ORDER BY path ASC, "entityId" ASC LIMIT 12'},
      {args: [root, 'wh', 'child', 'entity', {}, undefined, undefined, {start: 12, limit: 12}],
       expected: 'SELECT path, stub, hidden, "entityId", "revisionId", "revisionNum", proto, modified, created, touched, summary, data, tags FROM wh_entity WHERE (wh_entity.path <@ $1) ORDER BY path ASC, "entityId" ASC LIMIT 12 OFFSET 12'},
      {args: [root, 'wh', 'child', 'entity', {}, undefined, undefined, {entityId: '2355', start: 12, limit: 12}],
       expected: 'SELECT path, stub, hidden, "entityId", "revisionId", "revisionNum", proto, modified, created, touched, summary, data, tags FROM wh_entity WHERE (wh_entity.path <@ $1) ORDER BY path ASC, "entityId" ASC LIMIT 12 OFFSET 12'},
      {args: [root, 'wh', 'child', 'entity', {}, 'changed', undefined, {token: new Date(), entityId: '2355', start: 12, limit: 12}],
       expected: 'SELECT path, stub, hidden, "entityId", "revisionId", "revisionNum", proto, modified, created, touched, summary, data, tags FROM wh_entity WHERE (wh_entity.path <@ $1) AND ((wh_entity."modified", wh_entity."entityId") > ($2,$3)) ORDER BY modified ASC, "entityId" ASC LIMIT 12'},
      {args: [root, 'wh', 'child', 'entity', {}, 'created', undefined, {token: new Date(), entityId: '2355', start: 12, limit: 12}],
       expected: 'SELECT path, stub, hidden, "entityId", "revisionId", "revisionNum", proto, modified, created, touched, summary, data, tags FROM wh_entity WHERE (wh_entity.path <@ $1) AND ((wh_entity."created", wh_entity."entityId") > ($2,$3)) ORDER BY created ASC, "entityId" ASC LIMIT 12'},
    ];

    tests.forEach(function(test, index) {
      // Need to name this better
      it('correctly builds ' + index, function() {
        var tmp = query._queryGen.apply(this, test.args);
        tmp.text.should.equal(test.expected);
      });
    });
  });
});

describe('query', function() {
  it('#entityFromPath()', function(done) {
    var plan = new Plan(2, done);

    var selectQuery = 'SELECT path, stub, hidden, "entityId", "revisionId", "revisionNum", proto, modified, created, touched, summary, data, tags FROM wh_entity WHERE (path = $1)';

    var entpath = new sitepath(['wh', 'rq']);

    var Entclass = function() {};

    Entclass.prototype.fromDb = function(queryresp) {
    };

    var db = {};

    db.connectWrap = function(queryfunc) {
      var client = {};
      client.query = function(spec, func) {
        should.deepEqual(spec.text, selectQuery);
        func(null, {rowCount: 1});
      };
      queryfunc(null, client, function() {
        plan.ok(true);
      });
    };

    query.entityFromPath(db, Entclass, {}, {context: "ROOT"}, entpath, null, function(err, entity) {
      if (err) {
        should.fail(err);
      } else {
      }
      plan.ok(true);
    });
  });

  it('#fetchEffectivePermissions()', function(done) {
    var plan = new Plan(2, done);
    var selectQuery = 'SELECT permission, wh_subject_to_roles.role FROM wh_permission_to_role INNER JOIN wh_subject_to_roles ON (wh_permission_to_role.role = wh_subject_to_roles.role) WHERE (subject = $1) AND (ltree(text($2)) ~ wh_permission_to_role.query)';

    var entpath = new sitepath(['wh']);
    var user = new sitepath(['wh', 'users', 'wirehead']);

    var db = {};

    db.connectWrap = function(queryfunc) {
      var client = {};
      client.query = function(spec, func) {
        should.deepEqual(spec.text, selectQuery);
        func(null, {rowCount: 1, rows: ['root']});
      };
      queryfunc(null, client, function() {
        plan.ok(true);
      });
    };

    query.fetchEffectivePermissions(db, {}, user, entpath, function(err, entity) {
      if (err) {
        should.fail(err);
      } else {
      }
      plan.ok(true);
    });
  });

  it('query fromDb not_found', function(done) {
    var plan = new Plan(2, done);
    var selectQuery = 'SELECT path, stub, hidden, "entityId", "revisionId", "revisionNum", proto, modified, created, touched, summary, data, tags FROM wh_entity WHERE (path = $1)';

    var entpath = new sitepath(['wh', 'rq']);

    var Entclass = function() {};

    Entclass.prototype.fromDb = function(queryresp) {
      should.fail('should not try to call');
    };

    var db = {};

    db.connectWrap = function(queryfunc) {
      var client = {};
      client.query = function(spec, func) {
        should.deepEqual(spec.text, selectQuery);
        func(null, {rowCount: 0});
      };
      queryfunc(null, client, function() {
        plan.ok(true);
      });
    };

    query.entityFromPath(db, Entclass, {}, {context: "ROOT"}, entpath, null, function(err, entity) {
      if (err) {
        should.deepEqual(err.name, 'EntityNotFoundError');
        should.deepEqual(err.path, entpath.toDottedPath());
      } else {
        should.fail('should not succeed');
      }
      plan.ok(true);
    });
  });

  it('query fromDb error', function(done) {
    var plan = new Plan(2, done);
    var selectQuery = 'SELECT path, stub, hidden, "entityId", "revisionId", "revisionNum", proto, modified, created, touched, summary, data, tags FROM wh_entity WHERE (path = $1)';

    var entpath = new sitepath(['wh', 'rq']);

    var Entclass = function() {};

    Entclass.prototype.fromDb = function(queryresp) {
      should.fail('should not try to call');
    };

    var db = {};

    db.connectWrap = function(queryfunc) {
      var client = {};
      client.query = function(spec, func) {
        should.deepEqual(spec.text, selectQuery);
        func(new Error("Connection was ended during query"));
      };
      queryfunc(null, client, function() {
        plan.ok(true);
      });
    };

    query.entityFromPath(db, Entclass, {}, {context: "ROOT"}, entpath, null, function(err, entity) {
      if (err) {
        should.deepEqual(err.name, 'QueryError');
      } else {
        should.fail('should not succeed');
      }
      plan.ok(true);
    });
  });

  it('query fromDb not_found log', function(done) {
    var plan = new Plan(2, done);
    var selectQuery = 'SELECT path, "entityId", note, "baseRevisionId", "replaceRevisionId", \
"revisionId", "revisionNum", "evtStart", "evtEnd", "evtTouched", "evtClass", "evtFinal", "actorPath", data \
FROM wh_log WHERE ("revisionId" = $1)';

    var entpath = new sitepath(['wh', 'rq']);

    var Entclass = function() {};

    Entclass.prototype.fromDb = function(queryresp) {
      should.fail('should not try to call');
    };

    var db = {};

    db.connectWrap = function(queryfunc) {
      var client = {};
      client.query = function(spec, func) {
        should.deepEqual(spec.text, selectQuery);
        func(null, {rowCount: 0});
      };
      queryfunc(null, client, function() {
        plan.ok(true);
      });
    };

    query.entityFromPath(db, Entclass, {}, {context: "ROOT"}, entpath, '1234', function(err, entity) {
      if (err) {
        should.deepEqual(err.name, 'RevisionIdNotFoundError');
      } else {
        should.fail('should not succeed');
      }
      plan.ok(true);
    });
  });

  it('query fromDb error log', function(done) {
    var plan = new Plan(2, done);
    var selectQuery = 'SELECT path, "entityId", note, "baseRevisionId", "replaceRevisionId", \
"revisionId", "revisionNum", "evtStart", "evtEnd", "evtTouched", "evtClass", "evtFinal", "actorPath", data \
FROM wh_log WHERE ("revisionId" = $1)';

    var entpath = new sitepath(['wh', 'rq']);

    var Entclass = function() {};

    Entclass.prototype.fromDb = function(queryresp) {
      should.fail('should not try to call');
    };

    var db = {};

    db.connectWrap = function(queryfunc) {
      var client = {};
      client.query = function(spec, func) {
        should.deepEqual(spec.text, selectQuery);
        func(new Error("Connection was ended during query"));
      };
      queryfunc(null, client, function() {
        plan.ok(true);
      });
    };

    query.entityFromPath(db, Entclass, {}, {context: "ROOT"}, entpath, '1535', function(err, entity) {
      if (err) {
        should.deepEqual(err.name, 'QueryError');
      } else {
        should.fail('should not succeed');
      }
      plan.ok(true);
    });
  });

  it('query', function(done) {
    var plan = new Plan(3, done);
    var selectQuery = 'SELECT path, stub, hidden, "entityId", "revisionId", "revisionNum", proto, modified, created, touched, summary, data, tags FROM wh_entity WHERE (wh_entity.path <@ $1) ORDER BY path ASC, "entityId" ASC';

    var entpath = new sitepath(['wh']);

    var db = {};

    var rec = {path: 'wh.query',
      stub: false,
      entityId: 'f5f2e2e0-57cf-11e4-bca4-e7af6fd7ffe4',
      revisionId: 'f5f2e2e1-57cf-11e4-bca4-e7af6fd7ffe4',
      revisionNum: 1,
      proto: 'base',
      modified: new Date(),
      created: new Date(),
      summary: {title: 'blrg', abstract: 'some text goes here'},
      data: {posting: '<div></div>'}};

    db.connectWrap = function(queryfunc) {
      var client = {};
      client.query = function(spec) {
        should.deepEqual(spec.text, selectQuery);
        var ee = new events.EventEmitter();
        process.nextTick(function() {
          ee.emit('row', rec);
          ee.emit('end');
        });
        return ee;
      };
      queryfunc(null, client, function() {
        plan.ok(true);
      });
    };

    var root = {context: "ROOT"};

    var resp = query.query(db, {}, root, entpath, 'child', 'entity', {}, undefined, undefined, {});
    resp.on('article', function(article) {
      should.deepEqual(article.summary.title, rec.summary.title);
      should.deepEqual(article.summary.abstract, rec.summary.abstract);
      should.deepEqual(article.entityId, rec.entityId);
      plan.ok(true);
    });
    resp.on('error', function(err) {
      should.fail(err);
    });
    resp.on('end', function() {
      plan.ok(true);
    });
  });

  it('query count', function(done) {
    var plan = new Plan(3, done);
    var selectQuery = 'SELECT count(*) FROM wh_entity WHERE (wh_entity.path <@ $1)';

    var entpath = new sitepath(['wh']);

    var db = {};

    var rec = {count: '2'};

    db.connectWrap = function(queryfunc) {
      var client = {};
      client.query = function(spec) {
        should.deepEqual(spec.text, selectQuery);
        var ee = new events.EventEmitter();
        process.nextTick(function() {
          ee.emit('row', rec);
          ee.emit('end');
        });
        return ee;
      };
      queryfunc(null, client, function() {
        plan.ok(true);
      });
    };

    var root = {context: "ROOT"};

    var resp = query.query(db, {}, root, entpath, 'child', 'count', {}, undefined, undefined, {});
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

  it('queryHistory', function(done) {
    var plan = new Plan(3, done);
    var selectQuery = 'SELECT wh_log.path, wh_log."entityId", wh_log.note, \
wh_log."baseRevisionId", wh_log."replaceRevisionId", wh_log."revisionId", \
wh_log."revisionNum", wh_log."evtStart", wh_log."evtEnd", wh_log."evtTouched", \
wh_log."evtClass", wh_log."evtFinal", wh_log."actorPath", wh_log.data, actor.proto \
AS "actorProto", actor.summary AS "actorSummary" FROM wh_log LEFT JOIN wh_entity actor \
ON (actor.path = wh_log."actorPath") WHERE (wh_log.path = $1) ORDER BY wh_log."revisionNum" \
ASC';

    var entpath = new sitepath(['wh']);

    var db = {};

    var rec = {entityId: 'f5f2e2e0-57cf-11e4-bca4-e7af6fd7ffe4',
            note: 'test',
            baseRevisionId: 'f5f2e2e0-57cf-11e4-bca4-e7af6fd7ffe4',
            replaceRevisionId: 'f5f2e2e0-57cf-11e4-bca4-e7af6fd7ffe4',
            revisionId: 'f5f2e2e0-57cf-11e4-bca4-e7af6fd7ffe4',
            revisionNum: 1,
            evtStart: new Date(),
            evtEnd: new Date(),
            evtTouched: new Date(),
            evtClass: 'test',
            evtFinal: true,
            data: {}};

    db.connectWrap = function(queryfunc) {
      var client = {};
      client.query = function(spec) {
        should.deepEqual(spec.text, selectQuery);
        var ee = new events.EventEmitter();
        process.nextTick(function() {
          ee.emit('row', rec);
          ee.emit('end');
        });
        return ee;
      };
      queryfunc(null, client, function() {
        plan.ok(true);
      });
    };

    var resp = query.queryHistory(db, {}, {}, entpath, null, {});
    resp.on('article', function(article) {
      should.deepEqual(article.note, rec.note);
      should.deepEqual(article.data, rec.data);
      should.deepEqual(article.revisionId, rec.revisionId);
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
