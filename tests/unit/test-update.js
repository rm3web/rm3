var Conf = require ('../../lib/conf');
var entity = require('../../lib/entity');
var sitepath = require ('sitepath');
var update = require ('../../lib/update');
var should = require('chai').should();

describe('update', function() {
  it('executes correctly', function(done) {
    var insertQuery = 'INSERT INTO wh_entity (path, stub, "entityId", "revisionId", \
"revisionNum", proto, modified, created, touched, hidden, summary, data, tags, search) VALUES ($1, $2, \
$3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, (to_tsvector(\'english\', $14)))';
    var insertTagQuery = 'INSERT INTO wh_tag ("subjPath", "objClass", \
"predPath", "objStr") VALUES ($1, $2, $3, $4)';
    var deleteBeforeQuery = 'DELETE FROM wh_entity WHERE (path = $1) AND (stub = true)';

    var now = new Date();

    var ent = new entity.Entity();
    ent._path = new sitepath(['wh']);
    ent._proto = 'base';
    ent._created = now;
    ent._updated = now;
    ent.summary = {"title": "blrg",
      "abstract": "some text goes here"};
    ent.data.posting = '<div></div>';
    ent.addTag('navigation', 'navbar');

    var db = {};
    db.openTransaction = function(ctx, client, done, callback) {
      callback(null, client, done);
    };

    db.commitTransaction = function(ctx, client, callback) {
      callback(null);
    };

    db.connectWrap = function(queryfunc) {
      var client = {};
      client.query = function(spec, func) {
        if (spec.name === 'insert_entity_query') {
          spec.text.should.eql(insertQuery);
          spec.name.should.eql('insert_entity_query');
          spec.values[0].should.eql('wh'); //path
          spec.values[1].should.eql(false); //stub
          spec.values[4].should.eql(1); //revisionNum
          spec.values[5].should.eql('base'); //proto
          spec.values[10].should.eql(JSON.stringify(ent.summary)); // summary
          spec.values[11].should.eql(JSON.stringify(ent.data)); // summary
          func(null, {});
        } else if (spec.name === 'insert_tag_query') {
          spec.name.should.equal('insert_tag_query');
          spec.text.should.equal(insertTagQuery);
          spec.values[0].should.equal('wh');
          spec.values[1].should.equal('tag');
          spec.values[2].should.equal('navigation');
          spec.values[3].should.equal('navbar');
          func(null, {});
        } else if (spec.name === 'insert_entity_query_delete') {
          spec.name.should.equal('insert_entity_query_delete');
          spec.text.should.equal(deleteBeforeQuery);
          spec.values[0].should.equal('wh');
          func(null, {});
        } else {
          //t.deepEqual(spec.text, insertQuery);
          spec.name.should.eql('insert_log_query');
          spec.values[0].should.eql('wh'); //path
          should.not.exist(spec.values[3]); //base_revisionId
          should.not.exist(spec.values[4]); //replace_revisionId
          spec.values[6].should.eql(1); //revisionNum
          spec.values[10].should.eql('Create');
          spec.values[11].should.eql(true);
          var data = JSON.parse(spec.values[14]);
          data.toData.summary.should.eql(ent.summary);
          data.toData.data.should.eql(ent.data);
          func(null, {});
        }
      };
      queryfunc(null, client, function() { });
    };

    update.createEntity(db, {}, {context: 'ROOT'}, ent, true, 'create', function(err, entityId, revisionId, revisionNum) {
      if (err) {
        should.fail(err);
      } else {
      }
      done();
    });
  });
  it('fails on bad evt_class', function(done) {
    var logentry = {
      evtClass: 'this_is_not_valid',
      workflow: {}
    };
    update._private.execLogentry({}, true, undefined, undefined, logentry, function(err) {
      if (err) {
        err.name.should.equal('InvalidLogClass');
        done();
      } else {
        should.fail('this should error');
      }
    });
  });
});
