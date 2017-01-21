var Conf = require ('../../lib/conf');
var should = require('chai').should();
var childProcess = require('child_process');

var db = require('../../lib/db');
var entity = require('../../lib/entity');
var sitepath = require ('sitepath');
var query = require('../../lib/query');

describe('rm3rm', function() {
  this.timeout(20000); // This might take a bit of time

  it('should delete', function(done) {
    childProcess.execSync('./bin/rm3load -f ./tests/page-fixtures/front.json -p wh.rm3rm.test1');
    childProcess.execSync('./bin/rm3rm wh.rm3rm.test1');

    query.entityFromPath(db, false, entity.Entity, {}, {context: "ROOT"},
      new sitepath('wh.rm3rm.test1'), null, function(err, ent) {
        should.not.exist(err);
        ent.summary.deleted.should.equal(true);
        done();
      });
  });

});
