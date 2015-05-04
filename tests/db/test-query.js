var Conf = require ('../../lib/conf');
var entity = require('../../lib/entity');
var sitepath = require ('../../lib/sitepath');
var update = require('../../lib/update');
var query = require('../../lib/query');
var db = require('../../lib/db');
var user = require('../../lib/user');
var should = require('should');
var resources = require('../lib/resources.js');

function entities_should_mostly_equal(ent, ent2){
  should.deepEqual(ent2.summary,ent.summary);
  should.deepEqual(ent2.data,ent.data);
  should.deepEqual(ent2._path,ent._path);
  should.deepEqual(ent2._entity_id,ent._entity_id);
  should.deepEqual(ent2._revision_id,ent._revision_id);
  should.deepEqual(ent2._revision_num,ent._revision_num);
  should.deepEqual(ent2._created,ent._created);
  should.deepEqual(ent2._modified,ent._modified);
}

describe('query', function() {
  describe('#entity_from_path', function () {
    var ents = {};

    var path = new sitepath(['wh','entity_from_path']);
    var now = new Date();

    resources.entity_resource(path, ents, 'one', false, now);

    it('returns not found exceptions', function(done) {
      var badpath = new sitepath(['wh','rainbows']);

      query.entity_from_path(db, entity.Entity, {context: "ROOT"}, badpath, null, function(err, ent){
        should.deepEqual(err.name,'EntityNotFoundError');
        should.deepEqual(err.path,badpath.toDottedPath());
        done();
      });
    });

    it('returns entities', function(done) {
      query.entity_from_path(db, entity.Entity, {context: "ROOT"}, path, null, function(err, ent2){
        var ent = ents.one;
        entities_should_mostly_equal(ent,ent2);
        should.deepEqual(ent2._created,now);
        should.deepEqual(ent2._modified,now);
        done();
      });
    });

    it('returns entities using revid', function(done) {
      var ent = ents.one;
      query.entity_from_path(db, entity.Entity, {context: "ROOT"}, path, ent._revision_id, function(err, ent2){
        entities_should_mostly_equal(ent,ent2);
        should.deepEqual(ent2._created,now);
        should.deepEqual(ent2._modified,now);
        done();
      });
    });
  });

  describe('#query', function () {
    var ents = {};

    var path1 = new sitepath(['wh','query']);
    var path2 = new sitepath(['wh','query','sub']);
    var now = new Date();

    resources.entity_resource(path1, ents, 'one', false, now);
    resources.entity_resource(path2, ents, 'two', false, now);

    it('works', function(done) {
      var resp = query.query(db, {context: "ROOT"}, path1, 'child','entity',{},undefined,undefined);
      var arts = [];
      resp.on('article', function(article) {
        arts.push(article);
      });
      resp.on('error', function(err) {
        should.fail(err);
      });
      resp.on('end', function() {
        should.deepEqual(arts[0].title,'one');
        should.deepEqual(arts[0].path.toDottedPath(),'wh.query');
        should.deepEqual(arts[1].title,'two');
        should.deepEqual(arts[1].path.toDottedPath(),'wh.query.sub');
        should.deepEqual(arts.length,2);
        done();
      });
    });
  });

  describe("#query_history", function() {
    var ents = {};

    var path = new sitepath(['wh','query_history']);
    var now = new Date();

    resources.entity_resource(path, ents, 'one', false, now);

    before(function(done) {
      ents.updated = ents.one.clone();
      ents.updated.data.posting = "<div>blah blah blah</div>";
      ents.updated.summary.title = 'updated';
      update.update_entity(db, ents.one, ents.updated, true, 'update',
        function(err, entity_id, revision_id, revision_num) {
          entity_id.should.be.an.instanceof(String);
          revision_id.should.be.an.instanceof(String);
          revision_num.should.be.an.instanceof(Number);
          ents.updated._entity_id = entity_id;
          ents.updated._revision_id = revision_id;
          ents.updated._revision_num = revision_num;
          done(err);
        }
      );
    });

    it('works', function(done){
      var resp = query.query_history(db, {}, path);
      var arts = [];
      resp.on('article', function(article) {
        arts.push(article);
      });
      resp.on('error', function(err) {
        should.fail(err);
      });
      resp.on('end', function() {
        should.deepEqual(new Date(arts[1].data.to_data.created),now);
        should.deepEqual(arts[0].evt_class,'create');
        should.deepEqual(arts[1].evt_class,'update');
        should.deepEqual(arts[0].revision_num,1);
        should.deepEqual(arts[1].revision_num,2);
        should.deepEqual(arts[0].path.toDottedPath(), path.toDottedPath());
        should.deepEqual(arts[1].path.toDottedPath(), path.toDottedPath());
        should.deepEqual(arts.length,2);
        done();
      });      
    });
  });

  describe('roles', function() {
    var path = 'wh.query.*';
    var userpath = new sitepath(['wh','query','user']);
    var ents = {};
    var now = new Date();

    resources.user_resource(userpath, 'test', ents, 'user', now);
    resources.permission_resource('query-role', 'view', path);
    resources.permission_resource('query-role', 'stuff', path);
    resources.permission_resource('nobody', 'view', path);
    resources.assignment_resource(userpath, 'test', 'query-role');

    describe('#query', function() {
      var otherpath = new sitepath(['wh','query2','node']);
      resources.entity_resource(otherpath, ents, 'other', false, now);

      it('filters out forbidden nodes', function(done) {
        var context = {context: 'STANDARD', user: ents.user.path()};
        var resp = query.query(db, context, otherpath, 'child','entity',{},undefined,undefined);
        var arts = [];
        resp.on('article', function(article) {
          arts.push(article);
        });
        resp.on('error', function(err) {
          should.fail(err);
        });
        resp.on('end', function() {
          should.deepEqual(arts.length,0);
          done();
        });
      });


      it('lets allowed nodes through', function(done) {
        var context = {context: 'STANDARD', user: ents.user.path()};
        var resp = query.query(db, context, ents.user.path(), 'child','entity',{},undefined,undefined);
        var arts = [];
        resp.on('article', function(article) {
          arts.push(article);
        });
        resp.on('error', function(err) {
          should.fail(err);
        });
        resp.on('end', function() {
          should.deepEqual(arts.length,1);
          should.deepEqual(arts[0].summary,'i like unicorns and sparkles and ponies.');
          done();
        });
      });
    });

    describe('#fetch_effective_permissions', function() {
      var entpath = new sitepath(['wh','query','roles','node']);

      it('fetches for a user', function(done) {
        query.fetch_effective_permissions(db, ents.user.path(), entpath, function(err, permissions){
          if(err) {
            should.fail(err);
          } else {
            should.deepEqual(permissions,{ view: 'query-role', stuff: 'query-role'});
          }
          done(err);
        });
      });

      it('fetches for nobody', function(done) {
        query.fetch_effective_permissions(db, undefined, entpath, function(err, permissions){
          if(err) {
            should.fail(err);
          } else {
            should.deepEqual(permissions,{ view: 'nobody'});
          }
          done(err);
        });
      });

      it('fetches deeper permissions', function(done) {
        var entpath2 = new sitepath(['wh','query','roles','node', 'node2', 'node3']);
        query.fetch_effective_permissions(db, ents.user.path(), entpath, function(err, permissions){
          if(err) {
            should.fail(err);
          } else {
            should.deepEqual(permissions,{ view: 'query-role', stuff: 'query-role'});
          }
          done(err);
        });
      });
    });

    describe('#fetch_entity_from_path', function() {
      var entpath = new sitepath(['wh','query','user','test']);
      it('fetches the permissions with a user', function(done) {
        query.entity_from_path(db, entity.Entity, {context: 'STANDARD', user: entpath}, 
                               entpath, undefined, function(err, ent2){
          if(err) {
            should.fail(err);
          } else {
            should.deepEqual(ent2.permissions, { view: 'query-role', stuff: 'query-role'});
          }
          done(err);
        });
      });

      it('fetches the permissions without a user', function(done) {
        query.entity_from_path(db, entity.Entity, {context: 'STANDARD', user: undefined}, 
                               entpath, undefined, function(err, ent2){
          if(err) {
            should.fail(err);
          } else {
            should.deepEqual(ent2.permissions, { view: 'nobody'});
          }
          done(err);
        });
      });
    });

    describe('#permissions_for_user', function() {
      it('works', function(done) {
        var resp = query.permissions_for_user(db, ents.user.path());
        var arts = [];
        resp.on('article', function(article) {
          arts.push(article);
        });
        resp.on('error', function(err) {
          should.fail(err);
        });
        resp.on('end', function() {
          should.deepEqual(arts[0].permission,'stuff');
          should.deepEqual(arts[1].permission,'view');
          should.deepEqual(arts.length,2);
          done();
        });
      });
    });

    describe('#list_roles', function() {
      it('works', function(done) {
        var resp = query.list_roles(db);
        var arts = [];
        resp.on('article', function(article) {
          arts.push(article);
        });
        resp.on('error', function(err) {
          should.fail(err);
        });
        resp.on('end', function() {
          should.deepEqual(arts[0].role,'query-role');
          should.deepEqual(arts[1].role,'nobody');
          should.deepEqual(arts.length,2);
          done();
        });
      });
    });

    describe('#list_users_in_role', function() {
      it('works', function(done) {
        var resp = query.list_users_in_role(db,'query-role');
        var arts = [];
        resp.on('article', function(article) {
          arts.push(article);
        });
        resp.on('error', function(err) {
          should.fail(err);
        });
        resp.on('end', function() {
          should.deepEqual(arts[0].user,ents.user.path());
          should.deepEqual(arts.length,1);
          done();
        });
      });
    });

    describe('#list_permissions_in_role', function() {
      it('works', function(done) {
        var resp = query.list_permissions_in_role(db,'query-role');
        var arts = [];
        resp.on('article', function(article) {
          arts.push(article);
        });
        resp.on('error', function(err) {
          should.fail(err);
        });
        resp.on('end', function() {
          should.deepEqual(arts[0].path,'wh.query.*');
          should.deepEqual(arts[1].path,'wh.query.*');
          should.deepEqual(arts[0].permission,'view');
          should.deepEqual(arts[1].permission,'stuff');
          should.deepEqual(arts.length,2);
          done();
        });
      });
    });
  });

  after(function() {
    db.gun_database();
  });
});