var Conf = require ('../../lib/conf');
var test = require('tape');
var entity = require('../../lib/entity');
var sitepath = require ('../../lib/sitepath');
var async = require('async');
var uuid = require('node-uuid');

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

  var now = new Date();
  var ent = new entity.Entity();
  ent.createNew(new sitepath(['wh', 'create_create_delete']), 'base', now);
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
      var query = "SELECT entity_id, revision_id, revision_num FROM wh_entity WHERE path = 'wh.create_create_delete'";
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
      var query = "SELECT entity_id, revision_id, revision_num, evt_final, evt_end FROM wh_log WHERE path = 'wh.create_create_delete'";
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
      var query = "SELECT entity_id, revision_id, revision_num FROM wh_entity WHERE path = 'wh.create_create_delete'";
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
      var query = "SELECT entity_id, revision_id, revision_num FROM wh_log WHERE path = 'wh.create_create_delete'";
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
      var query = "SELECT entity_id, revision_id, revision_num FROM wh_entity WHERE path = 'wh.create_create_delete';";
      quick_query(db, query, function(err, result) {
        if(err) {
          t.fail(err);
        }
        t.deepEqual(result.rowCount, 0);
        callback(err, entity_id, revision_id, revision_num);
      });
    },
    function check_log_3(entity_id, revision_id, revision_num, callback) {
      var query = "SELECT evt_class, entity_id, revision_id, revision_num FROM wh_log WHERE path = 'wh.create_create_delete' ORDER BY revision_num ASC;";
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

  var now = new Date();
  var ent = new entity.Entity();
  var ent2;
  ent._path = new sitepath(['wh','create_update_delete']);
  ent._proto = 'base';
  ent.summary = {"title": "blrg",
    "abstract": "some text goes here"};
  ent.data.posting = longstr;
  ent._created = now;
  ent._modified = now;

  async.waterfall([
    function do_create(callback){
      update.create_entity(db, ent, true, 'create', callback);
    },
    function check_create_1(entity_id, revision_id, revision_num, callback) {
      ent._entity_id = entity_id;
      ent._revision_num = revision_num;
      var query = "SELECT entity_id, revision_id, revision_num FROM wh_entity WHERE path = 'wh.create_update_delete'";
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
      var query = "SELECT entity_id, revision_id, revision_num FROM wh_log WHERE path = 'wh.create_update_delete'";
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
      var query = "SELECT entity_id, revision_id, revision_num FROM wh_entity WHERE path = 'wh.create_update_delete'";
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
      var query = "SELECT entity_id, revision_id, revision_num, evt_class FROM wh_log WHERE path = 'wh.create_update_delete'";
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
      var query = "SELECT entity_id, revision_id, revision_num FROM wh_entity WHERE path = 'wh.create_update_delete';";
      quick_query(db, query, function(err, result) {
        if(err) {
          t.fail(err);
        }
        t.deepEqual(result.rowCount, 0);
        callback(err, entity_id, revision_id, revision_num);
      });
    },
    function check_log_3(entity_id, revision_id, revision_num, callback) {
      var query = "SELECT entity_id, revision_id, revision_num, evt_class FROM wh_log WHERE path = 'wh.create_update_delete'";
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

test('update create-move-delete', function (t) {
  //t.plan(33);
  var conString = 'postgresql://wirehead:rm3test@127.0.0.1/rm3unit';
  Conf._data.endpoints.postgres = conString;
  var update = require('../../lib/update');
  var db = require('../../lib/db');

  var longstr = '<div></div>';

  var now = new Date();

  var ent = new entity.Entity();
  var ent2;
  ent._path = new sitepath(['wh','create_move_delete']);
  ent._proto = 'base';
  ent._created = now;
  ent._modified = now;
  ent.summary = {"title": "blrg",
    "abstract": "some text goes here"};
  ent.data.posting = longstr;

  var newpath = new sitepath(['wh','create_move_delete2']);

  async.waterfall([
    function do_create(callback){
      update.create_entity(db, ent, true, 'create', callback);
    },
    function check_create_1(entity_id, revision_id, revision_num, callback) {
      ent._entity_id = entity_id;
      ent._revision_num = revision_num;
      var query = "SELECT entity_id, revision_id, revision_num FROM wh_entity WHERE path = 'wh.create_move_delete'";
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
      var query = "SELECT entity_id, revision_id, revision_num FROM wh_log WHERE path = 'wh.create_move_delete'";
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
      update.move_entity(db, ent, newpath, true, 'move', callback);      
    },
    function check_create_2(entity_id, revision_id, revision_num, callback) {
      ent._path = newpath;
      var query = "SELECT entity_id, revision_id, revision_num FROM wh_entity WHERE path = 'wh.create_move_delete2'";
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
      var query = "SELECT entity_id, revision_id, revision_num, evt_class FROM wh_log WHERE path = 'wh.create_move_delete'";
      quick_query(db, query, function(err, result) {
        if(err) {
          t.fail(err);
        }
        t.deepEqual(result.rowCount, 2);
        t.deepEqual(result.rows[0].evt_class, 'create');
        t.deepEqual(result.rows[0].entity_id, entity_id);
        t.notDeepEqual(result.rows[0].revision_id, result.rows[1].revision_id);
        t.notDeepEqual(result.rows[0].revision_num, result.rows[1].revision_num);
        t.deepEqual(result.rows[1].evt_class, 'move');
        t.deepEqual(result.rows[1].entity_id, entity_id);
        t.deepEqual(result.rows[1].revision_id, revision_id);
        t.deepEqual(result.rows[1].revision_num, revision_num);
        callback(err, entity_id, revision_id, revision_num);
      });
    },
    function do_delete(entity_id, revision_id, revision_num, callback){
      update.delete_entity(db, ent, true, 'delete', callback);
    },
    function check_create_3(entity_id, revision_id, revision_num, callback) {
      var query = "SELECT entity_id, revision_id, revision_num FROM wh_entity WHERE path = 'wh.create_move_delete2';";
      quick_query(db, query, function(err, result) {
        if(err) {
          t.fail(err);
        }
        t.deepEqual(result.rowCount, 0);
        callback(err, entity_id, revision_id, revision_num);
      });
    },
    function check_log_3(entity_id, revision_id, revision_num, callback) {
      var query = "SELECT entity_id, revision_id, revision_num, evt_class FROM wh_log WHERE path = 'wh.create_move_delete2'";
      quick_query(db, query, function(err, result) {
        if(err) {
          t.fail(err);
        }
        t.deepEqual(result.rowCount, 1);
        t.deepEqual(result.rows[0].evt_class, 'delete');
        t.deepEqual(result.rows[0].entity_id, entity_id);
        t.deepEqual(result.rows[0].revision_num, 2);
        t.deepEqual(result.rows[0].revision_id, revision_id);
        t.deepEqual(result.rows[0].revision_num, revision_num);
        callback(err, entity_id, revision_id, revision_num);
      });
    },
    function check_create_4(entity_id, revision_id, revision_num, callback) {
      var query = "SELECT entity_id, revision_id, revision_num FROM wh_entity WHERE path = 'wh.create_move_delete';";
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
      console.log(err);
      t.fail(err);
    }
    t.end();
    db.gun_database();
  });
});

test('update provisional create', function (t) {
  t.plan(16);
  var conString = 'postgresql://wirehead:rm3test@127.0.0.1/rm3unit';
  Conf._data.endpoints.postgres = conString;
  var update = require('../../lib/update');
  var db = require('../../lib/db');

  var longstr = '<div></div>';

  var now = new Date();

  var ent = new entity.Entity();
  ent._path = new sitepath(['wh', 'pcreate']);
  ent._proto = 'base';
  ent._created = now;
  ent._modified = now;
  ent.summary = {"title": "blrg",
    "abstract": "some text goes here"};
  ent.data.posting = longstr;

  async.waterfall([
    function do_create(callback){
      update.create_entity(db, ent, false, 'create', callback);
    },
    function check_create_1(entity_id, revision_id, revision_num, callback) {
      var query = "SELECT entity_id, revision_id, revision_num FROM wh_entity WHERE path = 'wh.pcreate';";
      quick_query(db, query, function(err, result) {
        if(err) {
          t.fail(err);
        }
        t.deepEqual(result.rowCount, 0);
        callback(err, entity_id, revision_id, revision_num);
      });
    },
    function check_log_1(entity_id, revision_id, revision_num, callback) {
      var query = "SELECT entity_id, revision_id, revision_num, evt_final, evt_end FROM wh_log WHERE path = 'wh.pcreate'";
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
    },
    function do_apply(entity_id, revision_id, revision_num, callback){
      update.commit_entity_rev(db, revision_id, callback);
    },
    function check_create_2(entity_id, revision_id, revision_num, callback) {
      var query = "SELECT entity_id, revision_id, revision_num FROM wh_entity WHERE path = 'wh.pcreate'";
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
      var query = "SELECT entity_id, revision_id, revision_num, evt_final, evt_end FROM wh_log WHERE path = 'wh.pcreate'";
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
    }
  ], function(err){
    if(err) {
      t.fail(err);
    }
    t.end();
    db.gun_database();
  });
});

test('update bad provisional create', function (t) {
  t.plan(2);
  var conString = 'postgresql://wirehead:rm3test@127.0.0.1/rm3unit';
  Conf._data.endpoints.postgres = conString;
  var update = require('../../lib/update');
  var db = require('../../lib/db');

  var longstr = '<div></div>';

  var now = new Date();

  var ent = new entity.Entity();
  ent._path = new sitepath(['wh', 'pcreate']);
  ent._proto = 'base';
  ent._created = now;
  ent._modified = now;
  ent.summary = {"title": "blrg",
    "abstract": "some text goes here"};
  ent.data.posting = longstr;

  async.waterfall([
    function do_apply(callback){
      update.commit_entity_rev(db, uuid.v1(), callback);
    },
  ], function(err){
    if(err) {
      t.pass('this errored');
      t.deepEqual(err.name, 'RevisionIdNotFoundError');
      t.end();
    } else {
      t.fail(err);
    }
    db.gun_database();
  });
});


test('update permit-permit-deny', function (t) {
  t.plan(12);
  var conString = 'postgresql://wirehead:rm3test@127.0.0.1/rm3unit';
  Conf._data.endpoints.postgres = conString;
  var update = require('../../lib/update');
  var db = require('../../lib/db');

  var longstr = '<div></div>';

  var path = 'wh.permit_permit_deny.*';

  async.waterfall([
    function do_create(callback){
      update.add_permission_to_role(db, "role", "permission", path, "note", callback);
    },
    function check_create_1(entity_id, revision_id, revision_num, callback) {
      var query = "SELECT role, permission, path FROM wh_permission_to_role WHERE path = 'wh.permit_permit_deny.*'";
      quick_query(db, query, function(err, result) {
        if(err) {
          t.fail(err);
        }
        t.deepEqual(result.rows[0].role, "role");
        t.deepEqual(result.rows[0].permission, "permission");
        t.deepEqual(result.rows[0].path, "wh.permit_permit_deny.*");
        callback(err, entity_id, revision_id, revision_num);
      });
    },
    function check_log_1(entity_id, revision_id, revision_num, callback) {
      var query = "SELECT evt_class, revision_id, evt_final, evt_end FROM wh_log WHERE revision_id = '" + revision_id + "'";
      quick_query(db, query, function(err, result) {
        if(err) {
          t.fail(err);
        }
        t.deepEqual(result.rowCount, 1);
        t.deepEqual(result.rows[0].evt_final, true);
        t.notDeepEqual(result.rows[0].evt_end, null);
        t.deepEqual(result.rows[0].revision_id, revision_id);
        callback(err, entity_id, revision_id, revision_num);
      });
    },
    function do_create_again(entity_id, revision_id, revision_num, callback){
      update.add_permission_to_role(db, "role", "permission", path, "note", function(err) {
        if (err) {
          t.deepEqual(err.name, 'DbDuplicateRecordError');
        } else {
          t.fail("didn't catch error");
        }
        callback(null, entity_id, revision_id, revision_num);
      });
    },
    function check_create_2(entity_id, revision_id, revision_num, callback) {
      var query = "SELECT role, permission, path FROM wh_permission_to_role WHERE path = 'wh.permit_permit_deny.*'";
      quick_query(db, query, function(err, result) {
        if(err) {
          t.fail(err);
        }
        t.deepEqual(result.rows[0].role, "role");
        t.deepEqual(result.rows[0].permission, "permission");
        t.deepEqual(result.rows[0].path, "wh.permit_permit_deny.*");
        callback(err, entity_id, revision_id, revision_num);
      });
    },
    function do_delete(entity_id, revision_id, revision_num, callback){
      update.remove_permission_from_role(db, "role", "permission", path, "note", callback);
    },
    function check_create_3(entity_id, revision_id, revision_num, callback) {
      var query = "SELECT entity_id, revision_id, revision_num FROM wh_entity WHERE path = 'wh.create_create_delete';";
      quick_query(db, query, function(err, result) {
        if(err) {
          t.fail(err);
        }
        t.deepEqual(result.rowCount, 0);
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