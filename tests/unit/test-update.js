var Conf = require ('../../lib/conf');
var entity = require('../../lib/entity');
var sitepath = require ('../../lib/sitepath');
var update = require ('../../lib/update');
var should = require('should');

describe('update', function() {
  it('executes correctly', function(done) {
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
      callback(null, client, done);
    };

    db.commit_transaction = function(client, callback) {
      callback(null);
    };

    db.connect_wrap = function (queryfunc) {
      var client = {};
      client.query = function(spec, func) {
        if(spec.name === 'insert_entity_query') {
          should.deepEqual(spec.text, insert_query);
          should.deepEqual(spec.name, 'insert_entity_query');
          should.deepEqual(spec.values[0], 'wh'); //path
          should.deepEqual(spec.values[1], false); //stub
          should.deepEqual(spec.values[4], 1); //revision_num
          should.deepEqual(spec.values[5], 'base'); //proto
          should.deepEqual(spec.values[8], JSON.stringify(ent.summary)); // summary
          should.deepEqual(spec.values[9], JSON.stringify(ent.data)); // summary
          func(null, {});
        } else{
          //t.deepEqual(spec.text, insert_query);
          should.deepEqual(spec.name, 'insert_log_query');
          should.deepEqual(spec.values[0], 'wh'); //path
          should.deepEqual(spec.values[3], null); //base_revision_id
          should.deepEqual(spec.values[4], null); //replace_revision_id
          should.deepEqual(spec.values[6], 1); //revision_num
          should.deepEqual(spec.values[10], 'create');
          should.deepEqual(spec.values[11], true);
          var data = JSON.parse(spec.values[12]);
          should.deepEqual(data.to_data.summary, ent.summary);
          should.deepEqual(data.to_data.data, ent.data);
          func(null, {});
        }
      };
      queryfunc(null, client, function()
        {
          
        });
    };

    update.create_entity(db, ent, true, 'create', function(err, entity_id, revision_id, revision_num){
      if(err) {
        should.fail(err);
      } else {
      }
      done();
    });
  });
  it('fails on bad evt_class', function(done) {
    var logentry = {
      evt_class: 'this_is_not_valid'
    };
    update._private.exec_logentry(true, undefined, undefined, logentry, function(err) {
      if (err) {
        should.deepEqual(err.name, 'InvalidLogClass');
        done();
      } else {
        should.fail('this should error');
      }
    });
  });
}); 
