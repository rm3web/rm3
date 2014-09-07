var Conf = require ('../../lib/conf');
var test = require('tape');
var entity = require('../../lib/entity');
var sitepath = require ('../../lib/sitepath');
var update = require ('../../lib/update');

test('update', function (t) {
  t.plan(10);
  
  insert_query = "INSERT INTO wh_entity (path, stub, entity_id, revision_id, \
revision_num, proto, modified, created, summary, data) VALUES ($1, $2, \
$3, $4, $5, $6, $7, $8, $9, $10);";

  ent = new entity.Entity();
  ent._path = new sitepath(['wh']);
  ent._proto = 'base';
  ent.summary = {"title": "blrg",
    "abstract": "some text goes here"};
  ent.data.posting = '<div></div>';
  db = {};
  db.connect_wrap = function (queryfunc) {
    client = {};
    client.query = function(spec, func) {
      t.pass('called query')
      t.deepEqual(spec.text, insert_query)
      t.deepEqual(spec.values[0], 'wh') //path
      t.deepEqual(spec.values[1], false) //stub
      t.deepEqual(spec.values[4], 1) //revision_num
      t.deepEqual(spec.values[5], 'base') //proto
      t.deepEqual(spec.values[8], ent.summary) // summary
      t.deepEqual(spec.values[9], ent.data) // summary
      func(null, {})
    }
    queryfunc(null, client, function()
      {
        t.pass('called done')
      });
  };

  update.create_entity(db, ent, function(err, entity_id, revision_id, revision_num){
    if(err) {
      t.fail(err);
    } else {
      t.pass('finished')
    }
    t.end();
  });
});