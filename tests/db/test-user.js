var Conf = require ('../../lib/conf');
var test = require('tape');
var entity = require('../../lib/entity');
var sitepath = require ('../../lib/sitepath');
var async = require('async');
var uuid = require('node-uuid');
var user = require('../../lib/user');

function quick_query(db, querytext, next) {
  async.waterfall([
    db.connect_wrap,
    function(client, done, callback){
      client.query(querytext, function(err, result){
        done(err);
        callback(err, result);
      });
    }
  ], next);
}

test('user', function (t) {
  t.plan(22);
  var conString = 'postgresql://wirehead:rm3test@127.0.0.1/rm3unit';
  Conf._data.endpoints.postgres = conString;
  var update = require('../../lib/update');
  var query = require('../../lib/query');
  var db = require('../../lib/db');

  var now = new Date();
  var ent = new entity.Entity();
  var userpath = new sitepath(['wh', 'users']);

  user.createUser(ent, userpath, 'test', 'test', now);

  ent.summary.abstract = 'profile';

  async.waterfall([
    function encode_password(callback) {
      user.encodePassword('meow_kitty', ent, callback);
    },
    function do_create(callback){
      update.create_entity(db, ent, true, 'create', callback);
    },
    function check_create_1(entity_id, revision_id, revision_num, callback) {
      ent._entity_id = entity_id;
      ent._revision_num = revision_num;
      var query = "SELECT entity_id, revision_id, revision_num FROM wh_entity WHERE path = 'wh.users.test'";
      quick_query(db, query, function(err, result) {
        if(err) {
          t.fail(err);
        }
        t.deepEqual(result.rows[0].entity_id, entity_id);
        t.deepEqual(result.rows[0].revision_id, revision_id);
        t.deepEqual(result.rows[0].revision_num, revision_num);
        callback(err, entity_id, revision_id, revision_num);
      });
    },
    function check_log_1(entity_id, revision_id, revision_num, callback) {
      var query = "SELECT entity_id, revision_id, revision_num, evt_final, evt_end FROM wh_log WHERE path = 'wh.users.test'";
      quick_query(db, query, function(err, result) {
        if(err) {
          t.fail(err);
        }
        t.deepEqual(result.rowCount, 1);
        t.deepEqual(result.rows[0].evt_final, true);
        t.notDeepEqual(result.rows[0].evt_end, null);
        t.deepEqual(result.rows[0].entity_id, entity_id);
        t.deepEqual(result.rows[0].revision_id, revision_id);
        t.deepEqual(result.rows[0].revision_num, revision_num);
        callback(err, entity_id, revision_id, revision_num);
      });
    },
    function en_by_username(entity_id, revision_id, revision_num, callback) {
      user.findByUsername(db, query, entity.Entity, userpath, 'test',function(err, ent2) {
        if(err) {
          t.fail(err);
        }
        callback(err, ent2, entity_id, revision_id, revision_num);
      });
    },
    function en_check_password(ent2, entity_id, revision_id, revision_num, callback) {
      user.authenticatePassword('meow_kitty', ent2, function(err) {
        if(err) {
          t.fail(err);
        }
        callback(err, entity_id, revision_id, revision_num);
      });
    },
    function do_assign(entity_id, revision_id, revision_num, callback) {
      update.assign_user_to_role(db, ent.path(), 'role', 'note', function(err) {
        if(err) {
          t.fail(err);
        }
        callback(err, entity_id, revision_id, revision_num);
      });
    },
    function check_assign_1(entity_id, revision_id, revision_num, callback) {
      ent._entity_id = entity_id;
      ent._revision_num = revision_num;
      var query = "SELECT subject, role FROM wh_subject_to_roles WHERE subject = 'wh.users.test'";
      quick_query(db, query, function(err, result) {
        if(err) {
          t.fail(err);
        }
        t.deepEqual(result.rows[0].subject, 'wh.users.test');
        t.deepEqual(result.rows[0].role, 'role');
        callback(err, entity_id, revision_id, revision_num);
      });
    },
    function check_log_2(entity_id, revision_id, revision_num, callback) {
      var query = "SELECT evt_final, evt_end, evt_class FROM wh_log WHERE path = 'wh.users.test'";
      quick_query(db, query, function(err, result) {
        if(err) {
          t.fail(err);
        }
        t.deepEqual(result.rowCount, 2);
        t.deepEqual(result.rows[0].evt_final, true);
        t.notDeepEqual(result.rows[0].evt_end, null);
        t.deepEqual(result.rows[0].evt_class,'create');
        t.deepEqual(result.rows[1].evt_class,'assign');
        callback(err, entity_id, revision_id, revision_num);
      });
    },
    function do_assign_2(entity_id, revision_id, revision_num, callback) {
      update.assign_user_to_role(db, ent.path(), 'role2', 'note', function(err) {
        if(err) {
          t.fail(err);
        }
        callback(err, entity_id, revision_id, revision_num);
      });
    },
    function check_assign_2(entity_id, revision_id, revision_num, callback) {
      ent._entity_id = entity_id;
      ent._revision_num = revision_num;
      var query = "SELECT subject, role FROM wh_subject_to_roles WHERE subject = 'wh.users.test' ORDER BY role ASC";
      quick_query(db, query, function(err, result) {
        if(err) {
          t.fail(err);
        }
        t.deepEqual(result.rowCount, 2);
        t.deepEqual(result.rows[0].subject, 'wh.users.test');
        t.deepEqual(result.rows[0].role, 'role');
        t.deepEqual(result.rows[1].subject, 'wh.users.test');
        t.deepEqual(result.rows[1].role, 'role2');
        callback(err, entity_id, revision_id, revision_num);
      });
    },
    function do_deassign(entity_id, revision_id, revision_num, callback) {
      update.remove_user_from_role(db, ent.path(), 'role2', 'note', function(err) {
        if(err) {
          t.fail(err);
        }
        callback(err, entity_id, revision_id, revision_num);
      });
    },
    function do_delete(entity_id, revision_id, revision_num, callback){
      update.delete_entity(db, ent, true, 'delete', callback);
    },
    function check_assign_3(entity_id, revision_id, revision_num, callback) {
      ent._entity_id = entity_id;
      ent._revision_num = revision_num;
      var query = "SELECT subject, role FROM wh_subject_to_roles WHERE subject = 'wh.users.test' ORDER BY role ASC";
      quick_query(db, query, function(err, result) {
        if(err) {
          t.fail(err);
        }
        t.deepEqual(result.rowCount, 0);
        callback(err, entity_id, revision_id, revision_num);
      });
    },
  ], function(err){
    if(err) {
      t.fail(err);
    }
    t.end();
    db.gun_database();
  });
});