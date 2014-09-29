var Conf = require ('../../lib/conf');
var test = require('tape');
var entity = require('../../lib/entity');
var sitepath = require ('../../lib/sitepath');
var async = require('async');

test.test('query', function (t) {
  t.plan(10);
  var conString = 'postgresql://wirehead:rm3test@127.0.0.1/rm3unit';
  Conf._data.endpoints.postgres = conString;
  var update = require('../../lib/update');
  var query = require('../../lib/query');
  var db = require('../../lib/db');

  ent = new entity.Entity();
  ent._path = new sitepath(['wh','query']);
  ent._proto = 'base';
  ent.summary = {"title": "blrg",
    "abstract": "some text goes here"};
  ent.data.posting = '<div></div>';

  async.waterfall([
    function cr_eate(callback){
      update.create_entity(db, ent, true, 'create', callback);
    },
    function en_from_path(entity_id, revision_id, revision_num, callback) {
      query.entity_from_path(db, entity.Entity, ent._path, null, function(err, ent2){
        t.deepEqual(ent2.summary,ent.summary);
        t.deepEqual(ent2.data,ent.data);
        t.deepEqual(ent2._path,ent._path);
        t.deepEqual(ent2._entity_id,entity_id);
        t.deepEqual(ent2._revision_id,revision_id);
        t.deepEqual(ent2._revision_num,revision_num);
        callback(err, ent2, revision_id);
      });
    },
    function en_from_revid(ent2, revision_id, callback) {
      query.entity_from_path(db, entity.Entity, ent._path, revision_id, function(err, ent3) {
        t.deepEqual(ent3.summary,ent.summary);
        t.deepEqual(ent3.data,ent.data);
        t.deepEqual(ent3._path,ent._path);
        t.deepEqual(ent3._revision_id,revision_id);
        callback(err, ent3);
      });
    },
    function del_ent(entity, callback) {
      update.delete_entity(db, entity, true, 'delete', callback);
    }
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

  ent = new entity.Entity();
  entpath = new sitepath(['wh','rainbows']);
  ent._proto = 'base';
  ent.summary = {"title": "blrg",
    "abstract": "some text goes here"};
  ent.data.posting = '<div></div>';

  async.waterfall([
    function en_from_a(callback) {
      query.entity_from_path(db, entity.Entity, entpath, null, function(err, ent2){
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
