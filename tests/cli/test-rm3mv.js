var Conf = require ('../../lib/conf');
var should = require('chai').should();
var childProcess = require('child_process');

var db = require('../../lib/db');
var entity = require('../../lib/entity');
var sitepath = require ('sitepath');
var query = require('../../lib/query');

describe('rm3mv', function() {
  this.timeout(40000); // This might take a bit of time

  it('should move', function(done) {
    childProcess.execSync('./bin/rm3load -f ./tests/page-fixtures/front.json -p wh.rm3mv.test1');
    childProcess.execSync('./bin/rm3mv wh.rm3mv.test1 wh.rm3mv.test2');

    query.entityFromPath(db, false, entity.Entity, {}, {context: "ROOT"},
      new sitepath('wh.rm3mv.test1'), null, function(err, ent) {
        should.not.exist(err);
        ent.summary.moved.should.equal(true);
        query.entityFromPath(db, false, entity.Entity, {}, {context: "ROOT"},
        new sitepath('wh.rm3mv.test2'), null, function(err, ent) {
          should.not.exist(err);
          ent._proto.should.equal('index');
          ent.summary.title.should.equal('Welcome to rm3');
          done();
        });
      });
  });
});
