var Conf = require ('../../lib/conf');
var entity = require('../../lib/entity');
var sitepath = require ('sitepath');
var update = require('../../lib/update');
var query = require('../../lib/query');
var db = require('../../lib/db');
var user = require('../../lib/user');
var should = require('should');
var resources = require('../lib/resources.js');
require('mocha-steps');

function entitiesShouldMostlyEqual(ent, ent2) {
  should.deepEqual(ent2.summary, ent.summary);
  should.deepEqual(ent2.data, ent.data);
  should.deepEqual(ent2._path, ent._path);
  should.deepEqual(ent2._entityId, ent._entityId);
  should.deepEqual(ent2._revisionId, ent._revisionId);
  should.deepEqual(ent2._revisionNum, ent._revisionNum);
  should.deepEqual(ent2._created, ent._created);
  should.deepEqual(ent2._modified, ent._modified);
}

describe('query', function() {
  this.timeout(8000); // This might take a bit of time

  describe('#entityFromPath', function() {
    var ents = {};

    var path = new sitepath(['wh', 'entityfrompath']);
    var now = new Date();

    resources.entityResource(path, ents, 'one', false, now);

    it('returns not found exceptions', function(done) {
      var badpath = new sitepath(['wh', 'rainbows']);

      query.entityFromPath(db, entity.Entity, {}, {context: "ROOT"}, badpath, null, function(err, ent) {
        should.deepEqual(err.name, 'EntityNotFoundError');
        should.deepEqual(err.path, badpath.toDottedPath());
        done();
      });
    });

    it('returns entities', function(done) {
      query.entityFromPath(db, entity.Entity, {}, {context: "ROOT"}, path, null, function(err, ent2) {
        var ent = ents.one;
        entitiesShouldMostlyEqual(ent, ent2);
        should.deepEqual(ent2._created, now);
        should.deepEqual(ent2._modified, now);
        done();
      });
    });

    it('returns entities using revid', function(done) {
      var ent = ents.one;
      query.entityFromPath(db, entity.Entity, {}, {context: "ROOT"}, path, ent._revisionId, function(err, ent2) {
        entitiesShouldMostlyEqual(ent, ent2);
        should.deepEqual(ent2._created, now);
        should.deepEqual(ent2._modified, now);
        done();
      });
    });
  });

  describe('#query', function() {
    var ents = {};

    var path1 = new sitepath(['wh', 'query']);
    var path2 = new sitepath(['wh', 'query', 'sub']);
    var now = new Date();

    resources.entityResource(path1, ents, 'one', false, now, function(e) {
      e.addTag('navigation', 'navbar');
    });

    resources.entityResource(path2, ents, 'two', false, now, function(e) {
      e.addTag(null, 'navbar');
    });

    it('works', function(done) {
      var resp = query.query(db, {}, {context: "ROOT"}, path1, 'child', 'entity', {}, undefined, undefined, {});
      var arts = [];
      resp.on('article', function(article) {
        arts.push(article);
      });
      resp.on('error', function(err) {
        should.fail(err);
      });
      resp.on('end', function() {
        should.deepEqual(arts[0].summary.title, 'one');
        should.deepEqual(arts[0].path.toDottedPath(), 'wh.query');
        should.deepEqual(arts[1].summary.title, 'two');
        should.deepEqual(arts[1].path.toDottedPath(), 'wh.query.sub');
        should.deepEqual(arts.length, 2);
        done();
      });
    });

    it('works for the navbar', function(done) {
      var resp = query.query(db, {}, {context: "ROOT"}, path1, 'child', 'entity', {navbar: true}, undefined, undefined, {});
      var arts = [];
      resp.on('article', function(article) {
        arts.push(article);
      });
      resp.on('error', function(err) {
        should.fail(err);
      });
      resp.on('end', function() {
        should.deepEqual(arts[0].summary.title, 'one');
        should.deepEqual(arts[0].path.toDottedPath(), 'wh.query');
        should.deepEqual(arts.length, 1);
        done();
      });
    });

    it('works for plain tags', function(done) {
      var resp = query.query(db, {}, {context: "ROOT"}, path1, 'child', 'entity', {predicate: 'plain', tag: 'navbar'}, undefined, undefined, {});
      var arts = [];
      resp.on('article', function(article) {
        arts.push(article);
      });
      resp.on('error', function(err) {
        should.fail(err);
      });
      resp.on('end', function() {
        should.deepEqual(arts[0].summary.title, 'two');
        should.deepEqual(arts[0].path.toDottedPath(), 'wh.query.sub');
        should.deepEqual(arts.length, 1);
        done();
      });
    });
  });

  describe("#queryHistory", function() {
    var ents = {};

    var path = new sitepath(['wh', 'queryhistory']);
    var now = new Date();

    resources.entityResource(path, ents, 'one', false, now);

    before(function(done) {
      ents.updated = ents.one.clone();
      ents.updated.data.posting = "<div>blah blah blah</div>";
      ents.updated.summary.title = 'updated';
      update.updateEntity(db, {}, {context: "ROOT"}, ents.one, ents.updated, true, 'update',
        function(err, entityId, revisionId, revisionNum) {
          entityId.should.be.an.instanceof(String);
          revisionId.should.be.an.instanceof(String);
          revisionNum.should.be.an.instanceof(Number);
          ents.updated._entityId = entityId;
          ents.updated._revisionId = revisionId;
          ents.updated._revisionNum = revisionNum;
          done(err);
        }
      );
    });

    it('works', function(done) {
      var resp = query.queryHistory(db, {}, {}, path, null, {});
      var arts = [];
      resp.on('article', function(article) {
        arts.push(article);
      });
      resp.on('error', function(err) {
        should.fail(err);
      });
      resp.on('end', function() {
        should.deepEqual(arts.length, 2);
        should.deepEqual(new Date(arts[1].data.toData.created), now);
        should.deepEqual(arts[0].evtClass, 'Create');
        should.deepEqual(arts[1].evtClass, 'Update');
        should.deepEqual(arts[0].revisionNum, 1);
        should.deepEqual(arts[1].revisionNum, 2);
        should.deepEqual(arts[0].path.toDottedPath(), path.toDottedPath());
        should.deepEqual(arts[1].path.toDottedPath(), path.toDottedPath());
        done();
      });
    });
  });

  describe('roles', function() {
    var path = 'wh.query.*';
    var userpath = new sitepath(['wh', 'query', 'user']);
    var ents = {};
    var now = new Date();

    resources.userResource(userpath, 'test', ents, 'user', now);
    resources.permissionResource('query-role', 'view', path);
    resources.permissionResource('query-role', 'stuff', path);
    resources.permissionResource('nobody', 'view', path);
    resources.assignmentResource(userpath, 'test', 'query-role');

    describe('#query', function() {
      var otherpath = new sitepath(['wh', 'query2', 'node']);
      resources.entityResource(otherpath, ents, 'other', false, now);

      it('filters out forbidden nodes', function(done) {
        var context = {context: 'STANDARD', user: ents.user.path()};
        var resp = query.query(db, {}, context, otherpath, 'child', 'entity', {}, undefined, undefined, {});
        var arts = [];
        resp.on('article', function(article) {
          arts.push(article);
        });
        resp.on('error', function(err) {
          should.fail(err);
        });
        resp.on('end', function() {
          should.deepEqual(arts.length, 0);
          done();
        });
      });

      it('lets allowed nodes through', function(done) {
        var context = {context: 'STANDARD', user: ents.user.path()};
        var resp = query.query(db, {}, context, ents.user.path(), 'child', 'entity', {}, undefined, undefined, {});
        var arts = [];
        resp.on('article', function(article) {
          arts.push(article);
        });
        resp.on('error', function(err) {
          should.fail(err);
        });
        resp.on('end', function() {
          should.deepEqual(arts.length, 1);
          should.deepEqual(arts[0].summary.abstract, 'i like unicorns and sparkles and ponies.');
          done();
        });
      });
    });

    describe('#fetchEffectivePermissions', function() {
      var entpath = new sitepath(['wh', 'query', 'roles', 'node']);

      it('fetches for a user', function(done) {
        query.fetchEffectivePermissions(db, {}, ents.user.path(), entpath, function(err, permissions) {
          if (err) {
            should.fail(err);
          } else {
            should.deepEqual(permissions, {view: 'query-role', stuff: 'query-role'});
          }
          done(err);
        });
      });

      it('fetches for nobody', function(done) {
        query.fetchEffectivePermissions(db, {}, undefined, entpath, function(err, permissions) {
          if (err) {
            should.fail(err);
          } else {
            should.deepEqual(permissions, {view: 'nobody'});
          }
          done(err);
        });
      });

      it('fetches deeper permissions', function(done) {
        var entpath2 = new sitepath(['wh', 'query', 'roles', 'node', 'node2', 'node3']);
        query.fetchEffectivePermissions(db, {}, ents.user.path(), entpath, function(err, permissions) {
          if (err) {
            should.fail(err);
          } else {
            should.deepEqual(permissions, {view: 'query-role', stuff: 'query-role'});
          }
          done(err);
        });
      });
    });

    describe('#fetch_entityFromPath', function() {
      var entpath = new sitepath(['wh', 'query', 'user', 'test']);
      it('fetches the permissions with a user', function(done) {
        query.entityFromPath(db, entity.Entity, {}, {context: 'STANDARD', user: entpath},
                               entpath, undefined, function(err, ent2) {
          if (err) {
            should.fail(err);
          } else {
            should.deepEqual(ent2.permissions, {view: 'query-role', stuff: 'query-role'});
          }
          done(err);
        });
      });

      it('fetches the permissions without a user', function(done) {
        query.entityFromPath(db, entity.Entity, {}, {context: 'STANDARD', user: undefined},
                               entpath, undefined, function(err, ent2) {
          if (err) {
            should.fail(err);
          } else {
            should.deepEqual(ent2.permissions, {view: 'nobody'});
          }
          done(err);
        });
      });
    });

    describe('#permissionsForUser', function() {
      it('works', function(done) {
        var resp = query.permissionsForUser(db, {}, ents.user.path());
        var arts = [];
        resp.on('article', function(article) {
          arts.push(article);
        });
        resp.on('error', function(err) {
          should.fail(err);
        });
        resp.on('end', function() {
          should.deepEqual(arts[0].permission, 'stuff');
          should.deepEqual(arts[1].permission, 'view');
          should.deepEqual(arts.length, 2);
          done();
        });
      });
    });

    describe('#listRoles', function() {
      it('works', function(done) {
        var resp = query.listRoles(db, {});
        var arts = [];
        resp.on('article', function(article) {
          arts.push(article);
        });
        resp.on('error', function(err) {
          should.fail(err);
        });
        resp.on('end', function() {
          should.deepEqual(arts[0].role, 'query-role');
          should.deepEqual(arts[1].role, 'nobody');
          should.deepEqual(arts.length, 2);
          done();
        });
      });
    });

    describe('#listUsersInRole', function() {
      it('works', function(done) {
        var resp = query.listUsersInRole(db, {}, 'query-role');
        var arts = [];
        resp.on('article', function(article) {
          arts.push(article);
        });
        resp.on('error', function(err) {
          should.fail(err);
        });
        resp.on('end', function() {
          should.deepEqual(arts[0].user, ents.user.path());
          should.deepEqual(arts.length, 1);
          done();
        });
      });
    });

    describe('#listPermissionsInRole', function() {
      it('works', function(done) {
        var resp = query.listPermissionsInRole(db, {}, 'query-role');
        var arts = [];
        resp.on('article', function(article) {
          arts.push(article);
        });
        resp.on('error', function(err) {
          should.fail(err);
        });
        resp.on('end', function() {
          should.deepEqual(arts[0].path, 'wh.query.*');
          should.deepEqual(arts[1].path, 'wh.query.*');
          should.deepEqual(arts[0].permission, 'view');
          should.deepEqual(arts[1].permission, 'stuff');
          should.deepEqual(arts.length, 2);
          done();
        });
      });
    });
  });

  describe('credential', function() {
    var ents = {};
    var delMark = {};
    var userpath = new sitepath(['wh', 'credential']);

    step('create', function createCredential(done) {
      update.createCredential(db, {}, 'test', 'blfr', null, {}, done);
    });

    step('check created credential', function checkCredential(done) {
      query.findCredential(db, {}, 'test', 'blfr', function(err, rec) {
        if (err) {
          return done(err);
        }
        rec.provider.should.equal('test');
        rec.userId.should.equal('blfr');
        done();
      });
    });
  });

  after(function() {
    db.gunDatabase();
  });
});
