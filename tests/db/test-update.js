var Conf = require ('../../lib/conf');
var test = require('tape');
var entity = require('../../lib/entity');
var sitepath = require ('../../lib/sitepath');
var async = require('async');


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

test('update', function (t) {
  t.plan(25);
  var conString = 'postgresql://wirehead:rm3test@127.0.0.1/rm3unit';
  Conf._data.endpoints.postgres = conString;
  var update = require('../../lib/update');
  var db = require('../../lib/db');

  var longstr = '<div></div>';

  ent = new entity.Entity();
  ent._path = new sitepath(['wh']);
  ent._proto = 'base';
  ent.summary = {"title": "blrg",
    "abstract": "some text goes here"};
  ent.data.posting = longstr;

  async.waterfall([
    function do_create(callback){
      update.create_entity(db, ent, callback);
    },
    function check_create_1(entity_id, revision_id, revision_num, callback) {
      ent._entity_id = entity_id;
      ent._revision_num = revision_num;
      query = "SELECT entity_id, revision_id, revision_num FROM wh_entity WHERE path = 'wh'";
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
      query = "SELECT entity_id, revision_id, revision_num FROM wh_log WHERE path = 'wh'";
      quick_query(db, query, function(err, result) {
        if(err) {
          t.fail(err);
        }
        t.deepEqual(result.rowCount, 1);
        t.deepEqual(result.rows[0].entity_id, entity_id);
        t.deepEqual(result.rows[0].revision_id, revision_id);
        t.deepEqual(result.rows[0].revision_num, revision_num);
        callback(err, entity_id, revision_id, revision_num);
      });
    },
    function do_create_again(entity_id, revision_id, revision_num, callback){
      update.create_entity(db, ent, function(err) {
        if (err) {
          t.deepEqual(err.name, 'DbDuplicateRecordError');
        } else {
          t.fail("didn't catch error");
        }
        callback(null, entity_id, revision_id, revision_num);
      });
    },
    function check_create_2(entity_id, revision_id, revision_num, callback) {
      query = "SELECT entity_id, revision_id, revision_num FROM wh_entity WHERE path = 'wh'";
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
    function check_log_2(entity_id, revision_id, revision_num, callback) {
      query = "SELECT entity_id, revision_id, revision_num FROM wh_log WHERE path = 'wh'";
      quick_query(db, query, function(err, result) {
        if(err) {
          t.fail(err);
        }
        t.deepEqual(result.rowCount, 1);
        t.deepEqual(result.rows[0].entity_id, entity_id);
        t.deepEqual(result.rows[0].revision_id, revision_id);
        t.deepEqual(result.rows[0].revision_num, revision_num);
        callback(err, entity_id, revision_id, revision_num);
      });
    },
    function do_delete(entity_id, revision_id, revision_num, callback){
      update.delete_entity(db, ent, callback);
    },
    function check_create_3(entity_id, revision_id, revision_num, callback) {
      query = "SELECT entity_id, revision_id, revision_num FROM wh_entity WHERE path = 'wh';";
      quick_query(db, query, function(err, result) {
        if(err) {
          t.fail(err);
        }
        t.deepEqual(result.rowCount, 0);
        callback(err, entity_id, revision_id, revision_num);
      });
    },
    function check_log_3(entity_id, revision_id, revision_num, callback) {
      query = "SELECT evt_class, entity_id, revision_id, revision_num FROM wh_log WHERE path = 'wh' ORDER BY revision_num ASC;";
      quick_query(db, query, function(err, result) {
        if(err) {
          t.fail(err);
        }
        t.deepEqual(result.rowCount, 2);
        t.deepEqual(result.rows[0].evt_class, 'create');
        t.deepEqual(result.rows[0].entity_id, entity_id);
        t.notDeepEqual(result.rows[0].revision_id, result.rows[1].revision_id);
        t.notDeepEqual(result.rows[0].revision_num, result.rows[1].revision_num);
        t.deepEqual(result.rows[1].evt_class, 'delete');
        t.deepEqual(result.rows[1].entity_id, entity_id);
        t.deepEqual(result.rows[1].revision_id, revision_id);
        t.deepEqual(result.rows[1].revision_num, revision_num);
        callback(err, entity_id, revision_id, revision_num);
      });
    }
  ], function(err){
    if(err) {
      t.fail(err);
    }
    t.end();
    db.gun_database();
  });
});