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

test('update create-create-delete', function (t) {
  t.plan(27);
  var conString = 'postgresql://wirehead:rm3test@127.0.0.1/rm3unit';
  Conf._data.endpoints.postgres = conString;
  var update = require('../../lib/update');
  var db = require('../../lib/db');

  var longstr = '<div></div>';

  var ent = new entity.Entity();
  ent._path = new sitepath(['wh', 'create_create_delete']);
  ent._proto = 'base';
  ent.summary = {"title": "blrg",
    "abstract": "some text goes here"};
  ent.data.posting = longstr;

  async.waterfall([
    function do_create(callback){
      update.create_entity(db, ent, true, 'create', callback);
    },
    function check_create_1(entity_id, revision_id, revision_num, callback) {
      ent._entity_id = entity_id;
      ent._revision_num = revision_num;
      query = "SELECT entity_id, revision_id, revision_num FROM wh_entity WHERE path = 'wh.create_create_delete'";
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
      query = "SELECT entity_id, revision_id, revision_num, evt_final, evt_end FROM wh_log WHERE path = 'wh.create_create_delete'";
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
    function do_create_again(entity_id, revision_id, revision_num, callback){
      update.create_entity(db, ent, true, 'create', function(err) {
        if (err) {
          t.deepEqual(err.name, 'DbDuplicateRecordError');
        } else {
          t.fail("didn't catch error");
        }
        callback(null, entity_id, revision_id, revision_num);
      });
    },
    function check_create_2(entity_id, revision_id, revision_num, callback) {
      query = "SELECT entity_id, revision_id, revision_num FROM wh_entity WHERE path = 'wh.create_create_delete'";
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
      query = "SELECT entity_id, revision_id, revision_num FROM wh_log WHERE path = 'wh.create_create_delete'";
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
      update.delete_entity(db, ent, true, 'delete', callback);
    },
    function check_create_3(entity_id, revision_id, revision_num, callback) {
      query = "SELECT entity_id, revision_id, revision_num FROM wh_entity WHERE path = 'wh.create_create_delete';";
      quick_query(db, query, function(err, result) {
        if(err) {
          t.fail(err);
        }
        t.deepEqual(result.rowCount, 0);
        callback(err, entity_id, revision_id, revision_num);
      });
    },
    function check_log_3(entity_id, revision_id, revision_num, callback) {
      query = "SELECT evt_class, entity_id, revision_id, revision_num FROM wh_log WHERE path = 'wh.create_create_delete' ORDER BY revision_num ASC;";
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

test('update create-update-delete', function (t) {
  t.plan(33);
  var conString = 'postgresql://wirehead:rm3test@127.0.0.1/rm3unit';
  Conf._data.endpoints.postgres = conString;
  var update = require('../../lib/update');
  var db = require('../../lib/db');

  var longstr = '<div></div>';

  var ent = new entity.Entity();
  var ent2;
  ent._path = new sitepath(['wh','create_update_delete']);
  ent._proto = 'base';
  ent.summary = {"title": "blrg",
    "abstract": "some text goes here"};
  ent.data.posting = longstr;

  async.waterfall([
    function do_create(callback){
      update.create_entity(db, ent, true, 'create', callback);
    },
    function check_create_1(entity_id, revision_id, revision_num, callback) {
      ent._entity_id = entity_id;
      ent._revision_num = revision_num;
      query = "SELECT entity_id, revision_id, revision_num FROM wh_entity WHERE path = 'wh.create_update_delete'";
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
      query = "SELECT entity_id, revision_id, revision_num FROM wh_log WHERE path = 'wh.create_update_delete'";
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
    function do_update(entity_id, revision_id, revision_num, callback){
      ent2 = ent.clone();
      ent2.data.posting = "<div>blah blah blah</div>";
      update.update_entity(db, ent, ent2, true, 'update', callback);
    },
    function check_create_2(entity_id, revision_id, revision_num, callback) {
      ent2._entity_id = entity_id;
      ent2._revision_num = revision_num;
      query = "SELECT entity_id, revision_id, revision_num FROM wh_entity WHERE path = 'wh.create_update_delete'";
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
    function check_log_2(entity_id, revision_id, revision_num, callback) {
      query = "SELECT entity_id, revision_id, revision_num, evt_class FROM wh_log WHERE path = 'wh.create_update_delete'";
      quick_query(db, query, function(err, result) {
        if(err) {
          t.fail(err);
        }
        t.deepEqual(result.rowCount, 2);
        t.deepEqual(result.rows[0].evt_class, 'create');
        t.deepEqual(result.rows[0].entity_id, entity_id);
        t.notDeepEqual(result.rows[0].revision_id, result.rows[1].revision_id);
        t.notDeepEqual(result.rows[0].revision_num, result.rows[1].revision_num);
        t.deepEqual(result.rows[1].evt_class, 'update');
        t.deepEqual(result.rows[1].entity_id, entity_id);
        t.deepEqual(result.rows[1].revision_id, revision_id);
        t.deepEqual(result.rows[1].revision_num, revision_num);
        callback(err, entity_id, revision_id, revision_num);
      });
    },
    function do_delete(entity_id, revision_id, revision_num, callback){
      update.delete_entity(db, ent2, true, 'delete', callback);
    },
    function check_create_3(entity_id, revision_id, revision_num, callback) {
      query = "SELECT entity_id, revision_id, revision_num FROM wh_entity WHERE path = 'wh.create_update_delete';";
      quick_query(db, query, function(err, result) {
        if(err) {
          t.fail(err);
        }
        t.deepEqual(result.rowCount, 0);
        callback(err, entity_id, revision_id, revision_num);
      });
    },
    function check_log_3(entity_id, revision_id, revision_num, callback) {
      query = "SELECT entity_id, revision_id, revision_num, evt_class FROM wh_log WHERE path = 'wh.create_update_delete'";
      quick_query(db, query, function(err, result) {
        if(err) {
          t.fail(err);
        }
        t.deepEqual(result.rowCount, 3);
        t.deepEqual(result.rows[1].evt_class, 'update');
        t.deepEqual(result.rows[1].entity_id, entity_id);
        t.deepEqual(result.rows[2].evt_class, 'delete');
        t.deepEqual(result.rows[2].entity_id, entity_id);
        t.deepEqual(result.rows[0].revision_num, 1);
        t.deepEqual(result.rows[1].revision_num, 2);
        t.deepEqual(result.rows[2].revision_num, 3);
        t.notDeepEqual(result.rows[2].revision_id, result.rows[1].revision_id);
        t.notDeepEqual(result.rows[2].revision_num, result.rows[1].revision_num);
        t.deepEqual(result.rows[2].revision_id, revision_id);
        t.deepEqual(result.rows[2].revision_num, revision_num);
        callback(err, entity_id, revision_id, revision_num);
      });
    },
  ], function(err){
    if(err) {
      console.log(err);
      t.fail(err);
    }
    t.end();
    db.gun_database();
  });
});

test('update provisional create', function (t) {
  t.plan(7);
  var conString = 'postgresql://wirehead:rm3test@127.0.0.1/rm3unit';
  Conf._data.endpoints.postgres = conString;
  var update = require('../../lib/update');
  var db = require('../../lib/db');

  var longstr = '<div></div>';

  var ent = new entity.Entity();
  ent._path = new sitepath(['wh', 'pcreate']);
  ent._proto = 'base';
  ent.summary = {"title": "blrg",
    "abstract": "some text goes here"};
  ent.data.posting = longstr;

  async.waterfall([
    function do_create(callback){
      update.create_entity(db, ent, false, 'create', callback);
    },
    function check_create(entity_id, revision_id, revision_num, callback) {
      query = "SELECT entity_id, revision_id, revision_num FROM wh_entity WHERE path = 'wh.pcreate';";
      quick_query(db, query, function(err, result) {
        if(err) {
          t.fail(err);
        }
        t.deepEqual(result.rowCount, 0);
        callback(err, entity_id, revision_id, revision_num);
      });
    },

    function check_log_1(entity_id, revision_id, revision_num, callback) {
      query = "SELECT entity_id, revision_id, revision_num, evt_final, evt_end FROM wh_log WHERE path = 'wh.pcreate'";
      quick_query(db, query, function(err, result) {
        if(err) {
          t.fail(err);
        }
        t.deepEqual(result.rowCount, 1);
        t.deepEqual(result.rows[0].evt_final, false);
        t.deepEqual(result.rows[0].evt_end, null);
        t.deepEqual(result.rows[0].entity_id, entity_id);
        t.deepEqual(result.rows[0].revision_id, revision_id);
        t.deepEqual(result.rows[0].revision_num, revision_num);
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
