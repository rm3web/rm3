var Conf = require ('../../lib/conf');
var entity = require('../../lib/entity');
var sitepath = require ('sitepath');
var query = require ('../../lib/query');
var events = require("events");
var should = require('chai').should();
var Plan = require('test-plan');
var uuid = require('uuid');

describe('activity query gen', function() {
  var root = {context: "ROOT"};

  describe('throws an error', function() {
    it('throws an error on when insecure', function() {
      (function() {
        query._activityQueryGen({context: 'USERLOOKUP'}, 'wh', 'child', 'count', {}, undefined, undefined, {});
      }).should.throw('invalid query');
    });
  });

  describe('generates the correct queries', function() {
    var tests = [
      {desc: 'for the children of a node with no user or filters',
        args: [root, 'wh', 'child', null, {}, {}],
        expected: 'SELECT path, "entityId", note, "baseRevisionId", "replaceRevisionId", "revisionId", "revisionNum", "evtStart", "evtEnd", "evtTouched", "evtClass", "evtFinal", "actorPath", workflow, data, obj.proto AS "objProto", obj.summary AS "objSummary", actor.proto AS "actorProto", actor.summary AS "actorSummary", obj."revisionId" AS "objRevisionId" FROM wh_entity LEFT JOIN wh_entity AS obj ON (obj.path = wh_log.path) LEFT JOIN wh_entity AS actor ON (actor.path = wh_log."actorPath") WHERE (wh_log.path <@ $1) ORDER BY wh_log."evtEnd" DESC, wh_log."revisionNum" DESC, wh_log."revisionId" DESC'},
      {desc: 'for the parents of a node with no user or filters',
        args: [root, 'wh', 'parents', null, {}, {}],
        expected: 'SELECT path, "entityId", note, "baseRevisionId", "replaceRevisionId", "revisionId", "revisionNum", "evtStart", "evtEnd", "evtTouched", "evtClass", "evtFinal", "actorPath", workflow, data, obj.proto AS "objProto", obj.summary AS "objSummary", actor.proto AS "actorProto", actor.summary AS "actorSummary", obj."revisionId" AS "objRevisionId" FROM wh_entity LEFT JOIN wh_entity AS obj ON (obj.path = wh_log.path) LEFT JOIN wh_entity AS actor ON (actor.path = wh_log."actorPath") WHERE (wh_log.path @> $1) ORDER BY wh_log."evtEnd" DESC, wh_log."revisionNum" DESC, wh_log."revisionId" DESC'},
      {desc: 'for the first-level children of a node with no user or filters',
        args: [root, 'wh', 'dir', null, {}, {}],
        expected: 'SELECT path, "entityId", note, "baseRevisionId", "replaceRevisionId", "revisionId", "revisionNum", "evtStart", "evtEnd", "evtTouched", "evtClass", "evtFinal", "actorPath", workflow, data, obj.proto AS "objProto", obj.summary AS "objSummary", actor.proto AS "actorProto", actor.summary AS "actorSummary", obj."revisionId" AS "objRevisionId" FROM wh_entity LEFT JOIN wh_entity AS obj ON (obj.path = wh_log.path) LEFT JOIN wh_entity AS actor ON (actor.path = wh_log."actorPath") WHERE (wh_log.path ~ lquery($1 || \'.*{1}\')) ORDER BY wh_log."evtEnd" DESC, wh_log."revisionNum" DESC, wh_log."revisionId" DESC'},
      {desc: 'for the children of a node with a user',
        args: [root, 'wh', 'child', new sitepath(['wh','errr']), {}, {}],
        expected: 'SELECT path, "entityId", note, "baseRevisionId", "replaceRevisionId", "revisionId", "revisionNum", "evtStart", "evtEnd", "evtTouched", "evtClass", "evtFinal", "actorPath", workflow, data, obj.proto AS "objProto", obj.summary AS "objSummary", actor.proto AS "actorProto", actor.summary AS "actorSummary", obj."revisionId" AS "objRevisionId" FROM wh_entity LEFT JOIN wh_entity AS obj ON (obj.path = wh_log.path) LEFT JOIN wh_entity AS actor ON (actor.path = wh_log."actorPath") WHERE (wh_log."actorPath" = $1) AND (wh_log.path <@ $2) ORDER BY wh_log."evtEnd" DESC, wh_log."revisionNum" DESC, wh_log."revisionId" DESC'},
      {desc: 'for paginated queries with a token',
        args: [root, 'wh', 'child', null, {}, {startId: 123, startNum: 10, startDate: new Date()}],
        expected: 'SELECT path, "entityId", note, "baseRevisionId", "replaceRevisionId", "revisionId", "revisionNum", "evtStart", "evtEnd", "evtTouched", "evtClass", "evtFinal", "actorPath", workflow, data, obj.proto AS "objProto", obj.summary AS "objSummary", actor.proto AS "actorProto", actor.summary AS "actorSummary", obj."revisionId" AS "objRevisionId" FROM wh_entity LEFT JOIN wh_entity AS obj ON (obj.path = wh_log.path) LEFT JOIN wh_entity AS actor ON (actor.path = wh_log."actorPath") WHERE (wh_log.path <@ $1) AND ((wh_log."evtEnd", wh_log."revisionNum", wh_log."revisionId") < ($2,$3,$4)) ORDER BY wh_log."evtEnd" DESC, wh_log."revisionNum" DESC, wh_log."revisionId" DESC'},
      {desc: 'for paginated queries with an offset',
        args: [root, 'wh', 'child', null, {}, {start: 123}],
        expected: 'SELECT path, "entityId", note, "baseRevisionId", "replaceRevisionId", "revisionId", "revisionNum", "evtStart", "evtEnd", "evtTouched", "evtClass", "evtFinal", "actorPath", workflow, data, obj.proto AS "objProto", obj.summary AS "objSummary", actor.proto AS "actorProto", actor.summary AS "actorSummary", obj."revisionId" AS "objRevisionId" FROM wh_entity LEFT JOIN wh_entity AS obj ON (obj.path = wh_log.path) LEFT JOIN wh_entity AS actor ON (actor.path = wh_log."actorPath") WHERE (wh_log.path <@ $1) ORDER BY wh_log."evtEnd" DESC, wh_log."revisionNum" DESC, wh_log."revisionId" DESC OFFSET $2'},
      {desc: 'for drafts',
        args: [root, 'wh', 'child', null, {drafts: true}, {}],
        expected: 'SELECT path, "entityId", note, "baseRevisionId", "replaceRevisionId", "revisionId", "revisionNum", "evtStart", "evtEnd", "evtTouched", "evtClass", "evtFinal", "actorPath", workflow, data, obj.proto AS "objProto", obj.summary AS "objSummary", actor.proto AS "actorProto", actor.summary AS "actorSummary", obj."revisionId" AS "objRevisionId" FROM wh_entity LEFT JOIN wh_entity AS obj ON (obj.path = wh_log.path) LEFT JOIN wh_entity AS actor ON (actor.path = wh_log."actorPath") WHERE (wh_log.path <@ $1) AND (wh_log."evtFinal" = $2) ORDER BY wh_log."evtEnd" DESC, wh_log."revisionNum" DESC, wh_log."revisionId" DESC'},
      {desc: 'for entries needing review',
        args: [root, 'wh', 'child', null, {needsReview: true}, {}],
        expected: 'SELECT path, "entityId", note, "baseRevisionId", "replaceRevisionId", "revisionId", "revisionNum", "evtStart", "evtEnd", "evtTouched", "evtClass", "evtFinal", "actorPath", workflow, data, obj.proto AS "objProto", obj.summary AS "objSummary", actor.proto AS "actorProto", actor.summary AS "actorSummary", obj."revisionId" AS "objRevisionId" FROM wh_entity LEFT JOIN wh_entity AS obj ON (obj.path = wh_log.path) LEFT JOIN wh_entity AS actor ON (actor.path = wh_log."actorPath") WHERE (wh_log.path <@ $1) AND (wh_log.workflow -> \'needsReview\' = \'true\') ORDER BY wh_log."evtEnd" DESC, wh_log."revisionNum" DESC, wh_log."revisionId" DESC'},
      {desc: 'for nobody',
        args: [{}, 'wh', 'child', null, {}, {}],
        expected: 'SELECT wh_log.path, wh_log."entityId", wh_log.note, wh_log."baseRevisionId", wh_log."replaceRevisionId", wh_log."revisionId", wh_log."revisionNum", wh_log."evtStart", wh_log."evtEnd", wh_log."evtTouched", wh_log."evtClass", wh_log."evtFinal", wh_log."actorPath", wh_log.workflow, wh_log.data, obj.proto AS "objProto", obj.summary AS "objSummary", actor.proto AS "actorProto", actor.summary AS "actorSummary", obj."revisionId" AS "objRevisionId" FROM wh_log INNER JOIN wh_permission_to_role ON (wh_log.path ~ wh_permission_to_role.query) LEFT JOIN wh_entity AS obj ON (obj.path = wh_log.path) LEFT JOIN wh_entity AS actor ON (actor.path = wh_log."actorPath") WHERE (wh_log.path <@ $1) AND (role = \'nobody\') AND (permission = \'view\') ORDER BY wh_log."evtEnd" DESC, wh_log."revisionNum" DESC, wh_log."revisionId" DESC'}
    ];

    tests.forEach(function(test, index) {
      // Need to name this better
      it(test.desc, function() {
        var tmp = query._activityQueryGen.apply(this, test.args);
        tmp.text.should.equal(test.expected);
      });
    });
  });
});

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
    it('throws an error on when insecure', function() {
      (function() {
        query._queryGen({context: 'USERLOOKUP'}, 'wh', 'child', 'count', {}, undefined, undefined, {});
      }).should.throw('invalid query');
    });
  });

  describe('generates the correct queries', function() {
    var tests = [
      {desc: 'with user of nobody',
        args: [{}, 'wh', 'child', 'count', {}, undefined, undefined, {}],
        expected: 'SELECT count(*) FROM wh_entity INNER JOIN wh_permission_to_role ON (wh_entity.path ~ wh_permission_to_role.query) WHERE (wh_entity.stub <> true) AND (wh_entity.path <@ $1) AND (wh_entity.hidden = false) AND (role = \'nobody\') AND (permission = \'view\')'},
      {desc: 'for an entity query (all the fields), basic child under a path',
        args: [root, 'wh', 'child', 'entity', {}, undefined, undefined, {}],
        expected: 'SELECT path, stub, hidden, "entityId", "revisionId", "revisionNum", proto, modified, created, touched, summary, data, tags FROM wh_entity WHERE (wh_entity.stub <> true) AND (wh_entity.path <@ $1) AND (wh_entity.hidden = false) ORDER BY path ASC, "entityId" ASC'},
      {desc: 'to count child under a path',
        args: [root, 'wh', 'child', 'count', {}, undefined, undefined, {}],
        expected: 'SELECT count(*) FROM wh_entity WHERE (wh_entity.stub <> true) AND (wh_entity.path <@ $1) AND (wh_entity.hidden = false)'},
      {desc: 'for parents under a path',
        args: [root, 'wh', 'parents', 'count', {}, undefined, undefined, {}],
        expected: 'SELECT count(*) FROM wh_entity WHERE (wh_entity.stub <> true) AND (wh_entity.path @> $1) AND (wh_entity.hidden = false)'},
      {desc: 'for just the first-level children',
        args: [root, 'wh', 'dir', 'count', {}, undefined, undefined, {}],
        expected: 'SELECT count(*) FROM wh_entity WHERE (wh_entity.stub <> true) AND (wh_entity.path ~ lquery($1 || \'.*{1}\')) AND (wh_entity.hidden = false)'},
      {desc: 'for the hidden nodes',
        args: [root, 'wh', 'child', 'count', {hidden: true}, undefined, undefined, {}],
        expected: 'SELECT count(*) FROM wh_entity WHERE (wh_entity.stub <> true) AND (wh_entity.path <@ $1) AND (wh_entity.hidden = true)'},
      {desc: 'for just a specific proto',
        args: [root, 'wh', 'child', 'count', {protos: ['blah']}, undefined, undefined, {}],
        expected: 'SELECT count(*) FROM wh_entity WHERE (wh_entity.stub <> true) AND (wh_entity.path <@ $1) AND (wh_entity.hidden = false) AND (proto = $2)'},
      {desc: 'for everything that is not a specific proto',
        args: [root, 'wh', 'child', 'count', {notprotos: ['blah']}, undefined, undefined, {}],
        expected: 'SELECT count(*) FROM wh_entity WHERE (wh_entity.stub <> true) AND (wh_entity.path <@ $1) AND (wh_entity.hidden = false) AND (proto <> $2)'},
      {desc: 'created before a time',
        args: [root, 'wh', 'child', 'count', {before: 123}, undefined, undefined, {}],
        expected: 'SELECT count(*) FROM wh_entity WHERE (wh_entity.stub <> true) AND (wh_entity.path <@ $1) AND (wh_entity.hidden = false) AND (created < $2)'},
      {desc: 'created after a time',
        args: [root, 'wh', 'child', 'count', {after: 123}, undefined, undefined, {}],
        expected: 'SELECT count(*) FROM wh_entity WHERE (wh_entity.stub <> true) AND (wh_entity.path <@ $1) AND (wh_entity.hidden = false) AND (created >= $2)'},
      {desc: 'for navbar entities',
        args: [root, 'wh', 'child', 'count', {navbar: true}, undefined, undefined, {}],
        expected: 'SELECT count(*) FROM wh_entity INNER JOIN wh_tag ON (wh_tag."subjPath" = wh_entity.path) WHERE (wh_entity.stub <> true) AND (wh_entity.path <@ $1) AND (wh_entity.hidden = false) AND ("predPath" = \'navigation\' AND "objStr" = \'navbar\')'},
      {desc: 'for comment entries',
        args: [root, 'wh', 'child', 'count', {comment: true}, undefined, undefined, {}],
        expected: 'SELECT count(*), actor.proto AS "actorProto", actor.summary AS "actorSummary" FROM wh_entity LEFT JOIN wh_entity AS actor ON (ltree(wh_entity.summary->>\'author\') = actor.path) INNER JOIN wh_tag ON (wh_tag."subjPath" = wh_entity.path) WHERE (wh_entity.stub <> true) AND (wh_entity.path <@ $1) AND (wh_entity.hidden = false) AND ("predPath" = \'navigation\' AND "objStr" = \'comment\')'},
      {desc: 'for plain tags',
        args: [root, 'wh', 'child', 'count', {predicate: 'plain', tag: 'bears'}, undefined, undefined, {}],
        expected: 'SELECT DISTINCT ON (wh_entity.path, wh_entity.path) count(*) FROM wh_entity INNER JOIN wh_tag ON (wh_tag."subjPath" = wh_entity.path) WHERE (wh_entity.stub <> true) AND (wh_entity.path <@ $1) AND (wh_entity.hidden = false) AND ("objStr" = $2) AND ("predPath" = $3) ORDER BY wh_entity.path ASC, wh_entity.path ASC'},
      {desc: 'for predicates',
        args: [root, 'wh', 'child', 'count', {predicates: true}, undefined, undefined, {}],
        expected: 'SELECT count(*) FROM wh_entity INNER JOIN wh_tag ON (wh_tag."subjPath" = wh_entity.path) WHERE (wh_entity.stub <> true) AND (wh_entity.path <@ $1) AND (wh_entity.hidden = false) AND ("predPath" = \'navigation\' AND "objStr" = \'predicate\')'},
      {desc: 'for a year-month filter',
        args: [root, 'wh', 'child', 'count', {yearMonth: new Date()}, undefined, undefined, {}],
        expected: 'SELECT count(*) FROM wh_entity WHERE (wh_entity.stub <> true) AND (wh_entity.path <@ $1) AND (wh_entity.hidden = false) AND (date_trunc(\'month\', created) = date_trunc(\'month\', $2::date))'},
      {desc: 'for a year-month filter sorted by changed',
        args: [root, 'wh', 'child', 'count', {yearMonth: new Date()}, 'changed', undefined, {}],
        expected: 'SELECT count(*) FROM wh_entity WHERE (wh_entity.stub <> true) AND (wh_entity.path <@ $1) AND (wh_entity.hidden = false) AND (date_trunc(\'month\', modified) = date_trunc(\'month\', $2::date))'},
      {desc: 'for sorting by changed',
        args: [root, 'wh', 'child', 'entity', {}, 'changed', undefined, {}],
        expected: 'SELECT path, stub, hidden, "entityId", "revisionId", "revisionNum", proto, modified, created, touched, summary, data, tags FROM wh_entity WHERE (wh_entity.stub <> true) AND (wh_entity.path <@ $1) AND (wh_entity.hidden = false) ORDER BY modified DESC, "entityId" DESC'},
      {desc: 'for sorting by created',
        args: [root, 'wh', 'child', 'entity', {}, 'created', undefined, {}],
        expected: 'SELECT path, stub, hidden, "entityId", "revisionId", "revisionNum", proto, modified, created, touched, summary, data, tags FROM wh_entity WHERE (wh_entity.stub <> true) AND (wh_entity.path <@ $1) AND (wh_entity.hidden = false) ORDER BY created DESC, "entityId" DESC'},
      {desc: 'for faceting by month created',
        args: [root, 'wh', 'child', 'count', {}, 'created', {on: 'month'}, {}],
        expected: 'SELECT count(*), date_trunc(\'month\', created) AS facet FROM wh_entity WHERE (wh_entity.stub <> true) AND (wh_entity.path <@ $1) AND (wh_entity.hidden = false) GROUP BY date_trunc(\'month\', created) ORDER BY date_trunc(\'month\', created) DESC'},
      {desc: 'for faceting by month modified',
        args: [root, 'wh', 'child', 'count', {}, 'changed', {on: 'month'}, {}],
        expected: 'SELECT count(*), date_trunc(\'month\', modified) AS facet FROM wh_entity WHERE (wh_entity.stub <> true) AND (wh_entity.path <@ $1) AND (wh_entity.hidden = false) GROUP BY date_trunc(\'month\', modified) ORDER BY date_trunc(\'month\', modified) DESC'},
      {desc: 'for faceting by tag',
        args: [root, 'wh', 'child', 'count', {}, 'created', {on: 'tag'}, {}],
        expected: 'SELECT count(*), "objStr" AS facet FROM wh_entity INNER JOIN wh_tag ON (wh_tag."subjPath" = wh_entity.path) WHERE (wh_entity.stub <> true) AND (wh_entity.path <@ $1) AND (wh_entity.hidden = false) AND ("predPath" <> \'navigation\') GROUP BY "objStr" HAVING (count(*) > 1) ORDER BY count(*) DESC'},
      {desc: 'for faceting by predicate',
        args: [root, 'wh', 'child', 'count', {}, 'created', {on: 'predicate'}, {}],
        expected: 'SELECT count(*), "predPath" AS facet FROM wh_entity INNER JOIN wh_tag ON (wh_tag."subjPath" = wh_entity.path) WHERE (wh_entity.stub <> true) AND (wh_entity.path <@ $1) AND (wh_entity.hidden = false) AND ("predPath" <> \'navigation\') GROUP BY "predPath" HAVING (count(*) > 1) ORDER BY "predPath" ASC'},
      {desc: 'with pagination with a token',
        args: [root, 'wh', 'child', 'entity', {}, undefined, undefined, {token: new sitepath(['wh','errr']), entityId: '2355', start: 12, limit: 12}],
        expected: 'SELECT path, stub, hidden, "entityId", "revisionId", "revisionNum", proto, modified, created, touched, summary, data, tags FROM wh_entity WHERE (wh_entity.stub <> true) AND (wh_entity.path <@ $1) AND (wh_entity.hidden = false) AND ((wh_entity."path", wh_entity."entityId") > ($2,$3)) ORDER BY path ASC, "entityId" ASC LIMIT $4'},
      {desc: 'with pagination with numbers',
        args: [root, 'wh', 'child', 'entity', {}, undefined, undefined, {start: 12, limit: 12}],
        expected: 'SELECT path, stub, hidden, "entityId", "revisionId", "revisionNum", proto, modified, created, touched, summary, data, tags FROM wh_entity WHERE (wh_entity.stub <> true) AND (wh_entity.path <@ $1) AND (wh_entity.hidden = false) ORDER BY path ASC, "entityId" ASC LIMIT $2 OFFSET $3'},
      {desc: 'with pagination using an entity id',
        args: [root, 'wh', 'child', 'entity', {}, undefined, undefined, {entityId: '2355', start: 12, limit: 12}],
        expected: 'SELECT path, stub, hidden, "entityId", "revisionId", "revisionNum", proto, modified, created, touched, summary, data, tags FROM wh_entity WHERE (wh_entity.stub <> true) AND (wh_entity.path <@ $1) AND (wh_entity.hidden = false) ORDER BY path ASC, "entityId" ASC LIMIT $2 OFFSET $3'},
      {desc: 'with pagination using a date sorting by changed',
        args: [root, 'wh', 'child', 'entity', {}, 'changed', undefined, {token: new Date(), entityId: '2355', start: 12, limit: 12}],
        expected: 'SELECT path, stub, hidden, "entityId", "revisionId", "revisionNum", proto, modified, created, touched, summary, data, tags FROM wh_entity WHERE (wh_entity.stub <> true) AND (wh_entity.path <@ $1) AND (wh_entity.hidden = false) AND ((wh_entity."modified", wh_entity."entityId") < ($2,$3)) ORDER BY modified DESC, "entityId" DESC LIMIT $4'},
      {desc: 'with pagination using a date sorting by created',
        args: [root, 'wh', 'child', 'entity', {}, 'created', undefined, {token: new Date(), entityId: '2355', start: 12, limit: 12}],
        expected: 'SELECT path, stub, hidden, "entityId", "revisionId", "revisionNum", proto, modified, created, touched, summary, data, tags FROM wh_entity WHERE (wh_entity.stub <> true) AND (wh_entity.path <@ $1) AND (wh_entity.hidden = false) AND ((wh_entity."created", wh_entity."entityId") < ($2,$3)) ORDER BY created DESC, "entityId" DESC LIMIT $4'}
    ];

    tests.forEach(function(test, index) {
      // Need to name this better
      it(test.desc, function() {
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
        spec.text.should.eql(selectQuery);
        func(null, {rowCount: 1, rows: [{stub:false}]});
      };
      queryfunc(null, client, function() {
        plan.ok(true);
      });
    };

    query.entityFromPath(db, false, Entclass, {}, {context: "ROOT"}, entpath, null, function(err, entity) {
      if (err) {
        should.fail(err);
      } else {
      }
      plan.ok(true);
    });
  });

  describe('#fetchEffectivePermissions', function() {
    it('works', function(done) {
      var plan = new Plan(2, done);
      var selectQuery = 'SELECT permission, wh_subject_to_roles.role FROM wh_permission_to_role INNER JOIN wh_subject_to_roles ON (wh_permission_to_role.role = wh_subject_to_roles.role) WHERE (subject = $1) AND (ltree(text($2)) ~ wh_permission_to_role.query)';

      var entpath = new sitepath(['wh']);
      var user = new sitepath(['wh', 'users', 'wirehead']);

      var db = {};

      db.connectWrap = function(queryfunc) {
        var client = {};
        client.query = function(spec, func) {
          spec.text.should.eql(selectQuery);
          func(null, {rowCount: 1, rows: [{permission: 'permission', role: 'role'}]});
        };
        queryfunc(null, client, function() {
          plan.ok(true);
        });
      };

      query.fetchEffectivePermissions(db, false, {}, user, entpath, function(err, entity) {
        if (err) {
          should.fail(err);
        } else {
        }
        entity.permission.should.equal('role');
        plan.ok(true);
      });
    });

    it('cache stored fail', function(done) {
      var selectQuery = 'SELECT permission, wh_subject_to_roles.role FROM wh_permission_to_role INNER JOIN wh_subject_to_roles ON (wh_permission_to_role.role = wh_subject_to_roles.role) WHERE (subject = $1) AND (ltree(text($2)) ~ wh_permission_to_role.query)';

      var entpath = new sitepath(['wh']);
      var user = new sitepath(['wh', 'users', 'wirehead']);

      var db = {};

      var cache = {};

      cache.get = function(key, next) {
        next(null, {notFound: true});
      };

      db.connectWrap = function(queryfunc) {
        var client = {};
        client.query = function(spec, func) {
          should.fail('should not try to call');
        };
        queryfunc(null, client, function() {
        });
      };

      query.fetchEffectivePermissions(db, cache, {}, user, entpath, function(err, entity) {
        if (err) {
          err.name.should.equal('PermissionsNotFoundError');
          done();
        } else {
          should.fail('shouldn\'t succeed when given a cached error');
        }
      });
    });

    it('cache miss', function(done) {
      var plan = new Plan(4, done);
      var selectQuery = 'SELECT permission, wh_subject_to_roles.role FROM wh_permission_to_role INNER JOIN wh_subject_to_roles ON (wh_permission_to_role.role = wh_subject_to_roles.role) WHERE (subject = $1) AND (ltree(text($2)) ~ wh_permission_to_role.query)';

      var entpath = new sitepath(['wh']);
      var user = new sitepath(['wh', 'users', 'wirehead']);

      var db = {};

      var cache = {};

      cache.get = function(key, next) {
        plan.ok(true);
        next(null, null);
      };

      cache.set = function(key, value, timeout) {
        plan.ok(true);
        key.should.equal('p:wh:wh.users.wirehead');
        value.should.eql({response: {permission: 'role'}});
      };

      db.connectWrap = function(queryfunc) {
        var client = {};
        client.query = function(spec, func) {
          spec.text.should.eql(selectQuery);
          func(null, {rowCount: 1, rows: [{permission: 'permission', role: 'role'}]});
        };
        queryfunc(null, client, function() {
          plan.ok(true);
        });
      };

      query.fetchEffectivePermissions(db, cache, {}, user, entpath, function(err, entity) {
        if (err) {
          should.fail(err);
        } else {
        }
        entity.permission.should.equal('role');
        plan.ok(true);
      });
    });

    it('cache hit', function(done) {
      var selectQuery = 'SELECT permission, wh_subject_to_roles.role FROM wh_permission_to_role INNER JOIN wh_subject_to_roles ON (wh_permission_to_role.role = wh_subject_to_roles.role) WHERE (subject = $1) AND (ltree(text($2)) ~ wh_permission_to_role.query)';

      var entpath = new sitepath(['wh']);
      var user = new sitepath(['wh', 'users', 'wirehead']);

      var db = {};

      var cache = {};

      cache.get = function(key, next) {
        next(null, {response: {permission: 'role'}});
      };

      db.connectWrap = function(queryfunc) {
        var client = {};
        client.query = function(spec, func) {
          should.fail('should not try to call');
        };
        queryfunc(null, client, function() {
        });
      };

      query.fetchEffectivePermissions(db, cache, {}, user, entpath, function(err, entity) {
        if (err) {
          should.fail(err);
        } else {
        }
        entity.permission.should.equal('role');
        done(err);
      });
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
        spec.text.should.eql(selectQuery);
        func(null, {rowCount: 0});
      };
      queryfunc(null, client, function() {
        plan.ok(true);
      });
    };

    query.entityFromPath(db, false, Entclass, {}, {context: "ROOT"}, entpath, null, function(err, entity) {
      if (err) {
        err.name.should.eql('EntityNotFoundError');
        err.path.should.eql(entpath.toDottedPath());
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
        spec.text.should.eql(selectQuery);
        func(new Error("Connection was ended during query"));
      };
      queryfunc(null, client, function() {
        plan.ok(true);
      });
    };

    query.entityFromPath(db, false, Entclass, {}, {context: "ROOT"}, entpath, null, function(err, entity) {
      if (err) {
        err.name.should.eql('QueryError');
      } else {
        should.fail('should not succeed');
      }
      plan.ok(true);
    });
  });

  it('query fromDb not_found log', function(done) {
    var plan = new Plan(2, done);
    var selectQuery = 'SELECT path, "entityId", note, "baseRevisionId", "replaceRevisionId", \
"revisionId", "revisionNum", "evtStart", "evtEnd", "evtTouched", "evtClass", "evtFinal", "actorPath", workflow, data \
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
        spec.text.should.eql(selectQuery);
        func(null, {rowCount: 0});
      };
      queryfunc(null, client, function() {
        plan.ok(true);
      });
    };

    query.entityFromPath(db, false, Entclass, {}, {context: "ROOT"}, entpath, '1234', function(err, entity) {
      if (err) {
        err.name.should.eql('RevisionIdNotFoundError');
      } else {
        should.fail('should not succeed');
      }
      plan.ok(true);
    });
  });

  it('query fromDb error log', function(done) {
    var plan = new Plan(2, done);
    var selectQuery = 'SELECT path, "entityId", note, "baseRevisionId", "replaceRevisionId", \
"revisionId", "revisionNum", "evtStart", "evtEnd", "evtTouched", "evtClass", "evtFinal", "actorPath", workflow, data \
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
        spec.text.should.eql(selectQuery);
        func(new Error("Connection was ended during query"));
      };
      queryfunc(null, client, function() {
        plan.ok(true);
      });
    };

    query.entityFromPath(db, false, Entclass, {}, {context: "ROOT"}, entpath, '1535', function(err, entity) {
      if (err) {
        err.name.should.eql('QueryError');
      } else {
        should.fail('should not succeed');
      }
      plan.ok(true);
    });
  });

  it('query', function(done) {
    var plan = new Plan(3, done);
    var selectQuery = 'SELECT path, stub, hidden, "entityId", "revisionId", "revisionNum", proto, modified, created, touched, summary, data, tags FROM wh_entity WHERE (wh_entity.stub <> true) AND (wh_entity.path <@ $1) AND (wh_entity.hidden = false) ORDER BY path ASC, "entityId" ASC';

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
        spec.text.should.eql(selectQuery);
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
      article.summary.title.should.eql(rec.summary.title);
      article.summary.abstract.should.eql(rec.summary.abstract);
      article.entityId.should.eql(rec.entityId);
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
    var selectQuery = 'SELECT count(*) FROM wh_entity WHERE (wh_entity.stub <> true) AND (wh_entity.path <@ $1) AND (wh_entity.hidden = false)';

    var entpath = new sitepath(['wh']);

    var db = {};

    var rec = {count: '2'};

    db.connectWrap = function(queryfunc) {
      var client = {};
      client.query = function(spec) {
        spec.text.should.eql(selectQuery);
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
      article.count.should.eql('2');
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
wh_log."evtClass", wh_log."evtFinal", wh_log."actorPath", wh_log.workflow, wh_log.data, actor.proto \
AS "actorProto", actor.summary AS "actorSummary" FROM wh_log LEFT JOIN wh_entity AS actor \
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
        spec.text.should.eql(selectQuery);
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
      article.note.should.eql(rec.note);
      article.data.should.eql(rec.data);
      article.revisionId.should.eql(rec.revisionId);
      plan.ok(true);
    });
    resp.on('error', function(err) {
      should.fail(err);
    });
    resp.on('end', function() {
      plan.ok(true);
    });
  });

  describe('#findBlob', function() {
    it('works', function(done) {
      var plan = new Plan(2, done);
      var selectQuery = 'SELECT details FROM wh_blob WHERE (provider = $1) AND ("entityPath" = $2) AND ("blobPath" = $3) AND ("revisionId" = $4)';

      var entpath = new sitepath(['wh']);
      var revisionId = uuid.v1();

      var db = {};

      db.connectWrap = function(queryfunc) {
        var client = {};
        client.query = function(spec, func) {
          spec.text.should.eql(selectQuery);
          func(null, {rowCount: 1, rows: [{details: {ponies: true}}]});
        };
        queryfunc(null, client, function() {
          plan.ok(true);
        });
      };

      query.findBlob(db, null, {}, 'test', 'test', entpath.toDottedPath(), 'blobpath', revisionId, function(err, rec) {
        should.not.exist(err);
        rec.ponies.should.equal(true);
        plan.ok(true);
      });
    });

    it('cache stored fail', function(done) {
      var entpath = new sitepath(['wh']);
      var revisionId = uuid.v1();

      var db = {};

      var cache = {};

      cache.get = function(key, next) {
        next(null, {notFound: true});
      };

      db.connectWrap = function(queryfunc) {
        var client = {};
        client.query = function(spec, func) {
          should.fail('should not try to call');
        };
        queryfunc(null, client, function() {
        });
      };

      query.findBlob(db, cache, {}, 'test', 'test', entpath.toDottedPath(), 'blobpath', revisionId, function(err, rec) {
        if (err) {
          err.name.should.equal('BlobNotFoundError');
          done();
        } else {
          should.fail('shouldn\'t succeed when given a cached error');
        }
      });
    });

    it('cache miss', function(done) {
      var plan = new Plan(4, done);
      var selectQuery = 'SELECT details FROM wh_blob WHERE (provider = $1) AND ("entityPath" = $2) AND ("blobPath" = $3) AND ("revisionId" = $4)';

      var entpath = new sitepath(['wh']);
      var revisionId = uuid.v1();

      var db = {};

      var cache = {};

      cache.get = function(key, next) {
        plan.ok(true);
        next(null, null);
      };

      cache.set = function(key, value, timeout) {
        plan.ok(true);
        key.should.equal('b:test-test-wh-' + revisionId + '-blobpath');
        value.should.eql({response: {ponies: true}});
      };

      db.connectWrap = function(queryfunc) {
        var client = {};
        client.query = function(spec, func) {
          spec.text.should.eql(selectQuery);
          func(null, {rowCount: 1, rows: [{details: {ponies: true}}]});
        };
        queryfunc(null, client, function() {
          plan.ok(true);
        });
      };

      query.findBlob(db, cache, {}, 'test', 'test', entpath.toDottedPath(), 'blobpath', revisionId, function(err, rec) {
        should.not.exist(err);
        rec.ponies.should.equal(true);
        plan.ok(true);
      });
    });

    it('cache hit', function(done) {
      var entpath = new sitepath(['wh']);
      var revisionId = uuid.v1();

      var db = {};

      var cache = {};

      cache.get = function(key, next) {
        next(null, {response: {permission: 'role'}});
      };

      db.connectWrap = function(queryfunc) {
        var client = {};
        client.query = function(spec, func) {
          should.fail('should not try to call');
        };
        queryfunc(null, client, function() {
        });
      };

      query.findBlob(db, cache, {}, 'test', 'test', entpath.toDottedPath(), 'blobpath', revisionId, function(err, rec) {
        should.not.exist(err);
        rec.permission.should.equal('role');
        done(err);
      });
    });
  });
});
