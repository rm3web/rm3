var Conf = require ('../../lib/conf');
var test = require('tape');
var entity = require('../../lib/entity');
var sitepath = require ('../../lib/sitepath');

test('update', function (t) {
  //t.plan(2);
  var conString = 'postgresql://wirehead:rm3test@127.0.0.1/rm3unit';
  Conf._data.endpoints.postgres = conString;
  var update = require('../../lib/update');
  var db = require('../../lib/db');

  var longstr = '<div></div>'

  ent = new entity.Entity();
  ent._path = new sitepath(['wh']);
  ent._proto = 'base'
  ent.summary = {"title": "blrg",
    "abstract": "some text goes here"}
  ent.data.posting = longstr;

  update.create_entity(ent, function(err, entity_id, revision_id, revision_num){
    if(err) {
      t.fail(err);
    }
    t.end();
    db.gun_database();
  })
});