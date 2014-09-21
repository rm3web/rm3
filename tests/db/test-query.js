var Conf = require ('../../lib/conf');
var test = require('tape');
var entity = require('../../lib/entity');
var sitepath = require ('../../lib/sitepath');
var async = require('async');

test.test('query', function (t) {
  t.plan(6);
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
    function(callback){
      update.create_entity(db, ent, callback);
    },
    function(entity_id, revision_id, revision_num, callback) {
      query.entity_from_path(db, entity.Entity, ent._path, null, function(err, entity){
        t.deepEqual(entity.summary,ent.summary);
        t.deepEqual(entity.data,ent.data);
        t.deepEqual(entity._path,ent._path);
        t.deepEqual(entity._entity_id,entity_id);
        t.deepEqual(entity._revision_id,revision_id);
        t.deepEqual(entity._revision_num,revision_num);
        callback(err, entity);
      });
    },
    function(entity, callback) {
      update.delete_entity(db, entity, callback);
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
    function(callback) {
      query.entity_from_path(db, entity.Entity, entpath, null, function(err, entity){
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
