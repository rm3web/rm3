var Conf = require ('../../lib/conf');
var test = require('tape');
var entity = require('../../lib/entity');
var sitepath = require ('../../lib/sitepath');
var async = require('async');
var user = require('../../lib/user');

test.test('query', function (t) {
  t.plan(31);
  var conString = 'postgresql://wirehead:rm3test@127.0.0.1/rm3unit';
  Conf._data.endpoints.postgres = conString;
  var update = require('../../lib/update');
  var query = require('../../lib/query');
  var db = require('../../lib/db');

  var now = new Date();
  var ent = new entity.Entity();
  ent.createNew(new sitepath(['wh','query']), 'base', now);
  ent.summary = {"title": "blrg",
    "abstract": "some text goes here"};
  ent.data.posting = '<div></div>';

  var qent = new entity.Entity();
  qent.createNew(new sitepath(['wh','query', 'sub']), 'base', now);
  qent.summary = {"title": "blrg sub",
    "abstract": "some text goes here"};
  qent.data.posting = '<div></div>';

  async.waterfall([
    function cr_eate(callback){
      update.create_entity(db, ent, true, 'create', callback);
    },
    function en_from_path(entity_id, revision_id, revision_num, callback) {
      query.entity_from_path(db, entity.Entity, {context: "ROOT"}, ent._path, null, function(err, ent2){
        t.deepEqual(ent2.summary,ent.summary);
        t.deepEqual(ent2.data,ent.data);
        t.deepEqual(ent2._path,ent._path);
        t.deepEqual(ent2._entity_id,entity_id);
        t.deepEqual(ent2._revision_id,revision_id);
        t.deepEqual(ent2._revision_num,revision_num);
        t.deepEqual(ent2._created,now);
        t.deepEqual(ent2._modified,now);
        callback(err, ent2, revision_id);
      });
    },
    function en_from_revid(ent2, revision_id, callback) {
      query.entity_from_path(db, entity.Entity, {context: "ROOT"}, ent._path, revision_id, function(err, ent3) {
        t.deepEqual(ent3.summary,ent.summary);
        t.deepEqual(ent3.data,ent.data);
        t.deepEqual(ent3._path,ent._path);
        t.deepEqual(ent3._revision_id,revision_id);
        t.deepEqual(ent3._created,now);
        t.deepEqual(ent3._modified,now);
        callback(err, ent3);
      });
    },
    function cr_eate2(ent3, callback){
      update.create_entity(db, qent, true, 'create', function(
        err, entity_id, revision_id, revision_num) {
        callback(err, ent3, qent);
      });
    },
    function query_op(entity, qent, callback) {
      var resp = query.query(db, {context: "ROOT"}, ent._path,'child','entity',{},undefined,undefined);
      var arts = [];
      resp.on('article', function(article) {
        arts.push(article);
      });
      resp.on('error', function(err) {
        t.fail(err);
      });
      resp.on('end', function() {
        t.deepEqual(arts[0].title,'blrg');
        t.deepEqual(arts[0].path.toDottedPath(),'wh.query');
        t.deepEqual(arts[1].title,'blrg sub');
        t.deepEqual(arts[1].path.toDottedPath(),'wh.query.sub');
        t.deepEqual(arts.length,2);
        callback(null, entity, qent);
      });
    },
    function query_hist(entity, qent, callback) {
      var resp = query.query_history(db, {}, ent._path);
      var arts = [];
      resp.on('article', function(article) {
        arts.push(article);
      });
      resp.on('error', function(err) {
        t.fail(err);
      });
      resp.on('end', function() {
        t.deepEqual(new Date(arts[0].data.to_data.created),now);
        t.deepEqual(arts[0].evt_class,'create');
        t.deepEqual(arts[0].revision_num,1);
        t.deepEqual(arts[0].path.toDottedPath(), 'wh.query');
        t.deepEqual(arts[0].data.to_data.data.posting, ent.data.posting);
        t.deepEqual(arts.length,1);
        callback(null, entity, qent);
      });
    },
    function del_qent(entity, qent, callback) {
      update.delete_entity(db, qent, true, 'delete', function(err) {
        callback(null, entity);
      });
    },
    function del_ent(entity, callback) {
      update.delete_entity(db, entity, true, 'delete', callback);
    },
    function query_hist2(entity_id, revision_id, revision_num, callback) {
      var resp = query.query_history(db, {}, ent._path);
      var arts = [];
      resp.on('article', function(article) {
        arts.push(article);
      });
      resp.on('error', function(err) {
        t.fail(err);
      });
      resp.on('end', function() {
        t.deepEqual(arts[0].evt_class,'create');
        t.deepEqual(arts[1].evt_class,'delete');
        t.deepEqual(arts[0].revision_num,1);
        t.deepEqual(arts[0].path.toDottedPath(), 'wh.query');
        t.deepEqual(arts[1].path.toDottedPath(), 'wh.query');
        t.deepEqual(arts.length,2);
        callback(null);
      });
    },
  ], function(err, result) {
    if(err) {
      t.fail(err);
    }
    db.gun_database();
    t.end();
  });
});

test.test('query not_found', function (t) {
  t.plan(2);
  var conString = 'postgresql://wirehead:rm3test@127.0.0.1/rm3unit';
  Conf._data.endpoints.postgres = conString;
  var update = require('../../lib/update');
  var query = require('../../lib/query');
  var db = require('../../lib/db');

  var ent = new entity.Entity();
  var entpath = new sitepath(['wh','rainbows']);
  ent._proto = 'base';
  ent.summary = {"title": "blrg",
    "abstract": "some text goes here"};
  ent.data.posting = '<div></div>';

  async.waterfall([
    function en_from_a(callback) {
      query.entity_from_path(db, entity.Entity, {context: "ROOT"}, entpath, null, function(err, ent2){
        t.deepEqual(err.name,'EntityNotFoundError');
        t.deepEqual(err.path,entpath.toDottedPath());
        callback();
      });
    }
  ], function(err, result) {
    if(err) {
      t.fail(err);
    }
    db.gun_database();
    t.end();
  });
});

test('query roles', function (t) {
  t.plan(8);
  var conString = 'postgresql://wirehead:rm3test@127.0.0.1/rm3unit';
  Conf._data.endpoints.postgres = conString;
  var update = require('../../lib/update');
  var query = require('../../lib/query');
  var db = require('../../lib/db');

  var longstr = '<div></div>';

  var now = new Date();
  var ent = new entity.Entity();

  var path = 'wh.query.*';
  var entpath = new sitepath(['wh','query','roles','node']);
  var userpath = new sitepath(['wh','query','user']);

  user.createUser(ent, userpath, 'test', 'test', now);

  async.waterfall([
    function encode_password(callback) {
      user.encodePassword('meow_kitty', ent, callback);
    },
    function do_create_user(callback){
      update.create_entity(db, ent, true, 'create', callback);
    },
    function do_create_permission(entity_id, revision_id, revision_num, callback){
      update.add_permission_to_role(db, "query-role", "permission", path, "note", callback);
    },
    function do_create_permission_2(entity_id, revision_id, revision_num, callback){
      update.add_permission_to_role(db, "nobody", "permission", path, "note", callback);
    },
    function do_assign(entity_id, revision_id, revision_num, callback) {
      update.assign_user_to_role(db, ent.path(), 'query-role', 'note', function(err) {
        if(err) {
          t.fail(err);
        }
        callback(err);
      });
    },
    function check_create_2(callback) {
      query.fetch_effective_permissions(db, ent.path(), entpath, function(err, permissions){
        if(err) {
          t.fail(err);
        } else {
          t.deepEqual(permissions,{ permission: 'query-role'});
          t.pass('finished');
        }
        callback(err);
      });
    },
    function check_create_3(callback) {
      query.fetch_effective_permissions(db, undefined, entpath, function(err, permissions){
        if(err) {
          t.fail(err);
        } else {
          t.deepEqual(permissions,{ permission: 'nobody'});
          t.pass('finished');
        }
        callback(err);
      });
    },
    function check_create_4(callback) {
      query.entity_from_path(db, entity.Entity, {context: 'STANDARD', user: ent.path()}, 
                             ent.path(), undefined, function(err, ent2){
        if(err) {
          t.fail(err);
        } else {
          t.deepEqual(ent2.permissions, { permission: 'query-role'});
          t.pass('finished');
        }
        callback(err);
      });
    },
    function check_create_5(callback) {
      query.entity_from_path(db, entity.Entity, {context: 'STANDARD', user: undefined}, 
                             ent.path(), undefined, function(err, ent2){
        if(err) {
          t.fail(err);
        } else {
          t.deepEqual(ent2.permissions, { permission: 'nobody'});
          t.pass('finished');
        }
        callback(err);
      });
    },
    function do_delete_role(callback){
      update.remove_permission_from_role(db, "query-role", "permission", path, "note", callback);
    },
    function do_delete_role_2(entity_id, revision_id, revision_num, callback){
      update.remove_permission_from_role(db, "nobody", "permission", path, "note", callback);
    },
    function do_deassign(entity_id, revision_id, revision_num, callback) {
      update.remove_user_from_role(db, ent.path(), 'query-role', 'note', function(err) {
        if(err) {
          t.fail(err);
        }
        callback(err);
      });
    },
    function do_delete(callback){
      update.delete_entity(db, ent, true, 'delete', callback);
    }
  ], function(err, entity_id, revision_id, revision_num){
    if(err) {
      t.fail(err);
    }
    t.end();
    db.gun_database();
  });
});