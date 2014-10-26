var Conf = require ('../../lib/conf');
var test = require('tape');
var entity = require('../../lib/entity');
var sitepath = require ('../../lib/sitepath');
var update = require ('../../lib/update');

test('update', function (t) {
  t.plan(23);
  
  var insert_query = "INSERT INTO wh_entity (path, stub, entity_id, revision_id, \
revision_num, proto, modified, created, summary, data) VALUES ($1, $2, \
$3, $4, $5, $6, $7, $8, $9, $10)";

  var now = new Date();

  var ent = new entity.Entity();
  ent._path = new sitepath(['wh']);
  ent._proto = 'base';
  ent._created = now;
  ent._updated = now;
  ent.summary = {"title": "blrg",
    "abstract": "some text goes here"};
  ent.data.posting = '<div></div>';
  var db = {};
  db.open_transaction = function(client, done, callback) {
    t.pass('called begin');
    callback(null, client, done);
  };

  db.commit_transaction = function(client, callback) {
    t.pass('called commit');
    callback(null);
  };

  db.connect_wrap = function (queryfunc) {
    var client = {};
    client.query = function(spec, func) {
      if(spec.name === 'insert_entity_query') {
        t.pass('called insert entity');
        t.deepEqual(spec.text, insert_query);
        t.deepEqual(spec.name, 'insert_entity_query');
        t.deepEqual(spec.values[0], 'wh'); //path
        t.deepEqual(spec.values[1], false); //stub
        t.deepEqual(spec.values[4], 1); //revision_num
        t.deepEqual(spec.values[5], 'base'); //proto
        t.deepEqual(spec.values[8], JSON.stringify(ent.summary)); // summary
        t.deepEqual(spec.values[9], JSON.stringify(ent.data)); // summary
        func(null, {});
      } else{
        t.pass('called insert log');
        //t.deepEqual(spec.text, insert_query);
        t.deepEqual(spec.name, 'insert_log_query');
        t.deepEqual(spec.values[0], 'wh'); //path
        t.deepEqual(spec.values[3], null); //base_revision_id
        t.deepEqual(spec.values[4], null); //replace_revision_id
        t.deepEqual(spec.values[6], 1); //revision_num
        t.deepEqual(spec.values[10], 'create');
        t.deepEqual(spec.values[11], true);
        var data = JSON.parse(spec.values[12]);
        t.deepEqual(data.to_data.summary, ent.summary);
        t.deepEqual(data.to_data.data, ent.data);
        func(null, {});
      }
    };
    queryfunc(null, client, function()
      {
        t.pass('called done');
      });
  };

  update.create_entity(db, ent, true, 'create', function(err, entity_id, revision_id, revision_num){
    if(err) {
      t.fail(err);
    } else {
      t.pass('finished');
    }
    t.end();
  });
});

test('update bad evt_class logentry', function (t) {
  t.plan(2);
  var logentry = {
    evt_class: 'this_is_not_valid'
  };
  update._private.exec_logentry(true, undefined, undefined, logentry, function(err) {
    if (err) {
      t.pass('this errored');
      t.deepEqual(err.name, 'InvalidLogClass');
      t.end();
    } else {
      t.fail('this should error');
    }
  });
});