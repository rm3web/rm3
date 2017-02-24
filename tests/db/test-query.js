var Conf = require ('../../lib/conf');
var entity = require('../../lib/entity');
var sitepath = require ('sitepath');
var update = require('../../lib/update');
var query = require('../../lib/query');
var db = require('../../lib/db');
var user = require('../../lib/authentication/user');
var should = require('chai').should();
var resources = require('../lib/resources.js');
var uuid = require('uuid');
require('mocha-steps');

function entitiesShouldMostlyEqual(ent, ent2) {
  ent2.summary.should.eql(ent.summary);
  ent2.data.should.eql(ent.data);
  ent2._path.should.eql(ent._path);
  ent2._entityId.should.eql(ent._entityId);
  ent2._revisionId.should.eql(ent._revisionId);
  ent2._revisionNum.should.eql(ent._revisionNum);
  ent2._created.should.eql(ent._created);
  ent2._modified.should.eql(ent._modified);
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

      query.entityFromPath(db, false, entity.Entity, {}, {context: "ROOT"}, badpath, null, function(err, ent) {
        err.name.should.equal('EntityNotFoundError');
        err.path.should.equal(badpath.toDottedPath());
        done();
      });
    });

    it('returns entities', function(done) {
      query.entityFromPath(db, false, entity.Entity, {}, {context: "ROOT"}, path, null, function(err, ent2) {
        var ent = ents.one;
        entitiesShouldMostlyEqual(ent, ent2);
        ent2._created.should.eql(now);
        ent2._modified.should.eql(now);
        done();
      });
    });

    it('returns entities using revid', function(done) {
      var ent = ents.one;
      query.entityFromPath(db, false, entity.Entity, {}, {context: "ROOT"}, path, ent._revisionId, function(err, ent2) {
        entitiesShouldMostlyEqual(ent, ent2);
        ent2._created.should.eql(now);
        ent2._modified.should.eql(now);
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
        arts[0].summary.title.should.equal('one');
        arts[0].path.toDottedPath().should.equal('wh.query');
        arts[1].summary.title.should.equal('two');
        arts[1].path.toDottedPath().should.equal('wh.query.sub');
        arts.length.should.equal(2);
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
        arts[0].summary.title.should.equal('one');
        arts[0].path.toDottedPath().should.equal('wh.query');
        arts.length.should.equal(1);
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
        arts[0].summary.title.should.equal('two');
        arts[0].path.toDottedPath().should.equal('wh.query.sub');
        arts.length.should.equal(1);
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
      update.updateEntity(db, {}, {context: "ROOT"}, ents.one, ents.updated, true, false, 'update',
        function(err, entityId, revisionId, revisionNum) {
          entityId.should.be.a('string');
          revisionId.should.be.a('string');
          revisionNum.should.be.a('number');
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
        arts.length.should.equal(2);
        now.should.eql(new Date(arts[1].data.toData.created));
        arts[0].evtClass.should.eql('Create');
        arts[1].evtClass.should.eql('Update');
        arts[0].revisionNum.should.eql(1);
        arts[1].revisionNum.should.eql(2);
        arts[0].path.toDottedPath().should.eql(path.toDottedPath());
        arts[1].path.toDottedPath().should.eql(path.toDottedPath());
        done();
      });
    });
  });

  describe('roles', function() {
    var path = 'wh.query.*';
    var userpath = new sitepath(['wh', 'query', 'user']);
    var ents = {};
    var now = new Date();

    resources.userResource(userpath, 'querytest', ents, 'user', now);
    resources.permissionResource('query-role', 'view', path);
    resources.permissionResource('query-role', 'stuff', path);
    resources.permissionResource('nobody', 'view', path);
    resources.assignmentResource(userpath, 'querytest', 'query-role');

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
          arts.length.should.equal(0);
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
          arts.length.should.equal(1);
          arts[0].summary.abstract.should.equal('i like unicorns and sparkles and ponies.');
          done();
        });
      });
    });

    describe('#fetchEffectivePermissions', function() {
      var entpath = new sitepath(['wh', 'query', 'roles', 'node']);

      it('fetches for a user', function(done) {
        query.fetchEffectivePermissions(db, false, {}, ents.user.path(), entpath, function(err, permissions) {
          if (err) {
            should.fail(err);
          } else {
            permissions.should.eql({view: 'query-role', stuff: 'query-role'});
          }
          done(err);
        });
      });

      it('fetches for nobody', function(done) {
        query.fetchEffectivePermissions(db, false, {}, undefined, entpath, function(err, permissions) {
          if (err) {
            should.fail(err);
          } else {
            permissions.should.eql({view: 'nobody'});
          }
          done(err);
        });
      });

      it('fetches deeper permissions', function(done) {
        var entpath2 = new sitepath(['wh', 'query', 'roles', 'node', 'node2', 'node3']);
        query.fetchEffectivePermissions(db, false, {}, ents.user.path(), entpath, function(err, permissions) {
          if (err) {
            should.fail(err);
          } else {
            permissions.should.eql({view: 'query-role', stuff: 'query-role'});
          }
          done(err);
        });
      });
    });

    describe('#fetch_entityFromPath', function() {
      var entpath = new sitepath(['wh', 'query', 'user', 'querytest']);
      it('fetches the permissions with a user', function(done) {
        query.entityFromPath(db, false, entity.Entity, {}, {context: 'STANDARD', user: entpath}, entpath, undefined, function(err, ent2) {
          if (err) {
            should.fail(err);
          } else {
            ent2.permissions.should.eql({view: 'query-role', stuff: 'query-role'});
          }
          done(err);
        });
      });

      it('fetches the permissions without a user', function(done) {
        query.entityFromPath(db, false, entity.Entity, {}, {context: 'STANDARD', user: undefined}, entpath, undefined, function(err, ent2) {
          if (err) {
            should.fail(err);
          } else {
            ent2.permissions.should.eql({view: 'nobody'});
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
          arts[0].permission.should.equal('stuff');
          arts[1].permission.should.equal('view');
          arts.length.should.equal(2);
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
          arts[0].role.should.equal('query-role');
          arts[1].role.should.equal('nobody');
          arts.length.should.equal(2);
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
          arts[0].user.should.eql(ents.user.path());
          arts.length.should.equal(1);
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
          arts[0].path.should.eql('wh.query.*');
          arts[1].path.should.eql('wh.query.*');
          arts[0].permission.should.eql('view');
          arts[1].permission.should.eql('stuff');
          arts.length.should.equal(2);
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

    step('list credentials', function listCredentials(done) {
      var resp = query.listCredentials(db, {});
      var arts = [];
      resp.on('article', function(article) {
        if (article.provider === 'test') {
          arts.push(article);
        }
      });
      resp.on('error', function(err) {
        should.fail(err);
      });
      resp.on('end', function() {
        arts.length.should.equal(1);
        done();
      });
    });
  });

  describe('serviceaccount', function() {
    var ents = {};
    var delMark = {};

    step('create', function createCredential(done) {
      update.createServiceAccount(db, {}, 'test', 'blfr', {}, done);
    });

    step('check created credential', function checkCredential(done) {
      query.findServiceAccount(db, {}, 'test', 'blfr', function(err, rec) {
        should.not.exist(err);
        rec.provider.should.equal('test');
        rec.clientId.should.equal('blfr');
        done(err);
      });
    });
  });

  describe('blob', function() {
    var ents = {};
    var delMark = {};
    var entityPath = new sitepath(['wh', 'blob', 'query']);
    var revisionId = uuid.v1();

    step('create', function createCredential(done) {
      update.addBlob(db, {}, 'test', 'test', entityPath.toDottedPath(), 'blobpath2', revisionId, true, true, {'angels': true}, done);
    });

    step('check created blob', function checkCredential(done) {
      query.findBlob(db, null, {}, 'test', 'test', entityPath.toDottedPath(), 'blobpath2', revisionId, function(err, rec) {
        if (err) {
          return done(err);
        }
        rec.angels.should.equal(true);
        done();
      });
    });

    step('list blob', function checkCredential(done) {
      var resp = query.listBlobs(db, {}, entityPath.toDottedPath());
      var arts = [];
      resp.on('article', function(article) {
        arts.push(article);
      });
      resp.on('error', function(err) {
        should.fail(err);
      });
      resp.on('end', function() {
        arts.length.should.equal(1);
        arts[0].details.angels.should.equal(true);
        done();
      });
    });
  });

  after(function() {
    db.gunDatabase();
  });
});
