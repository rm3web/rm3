var Conf = require ('../../lib/conf');
var should = require('should');
var childProcess = require('child_process');

var db = require('../../lib/db');
var entity = require('../../lib/entity');
var sitepath = require ('sitepath');
var query = require('../../lib/query');

describe('rm3load', function() {
  this.timeout(12000); // This might take a bit of time
  it('should load from a JSON file', function(done) {
    childProcess.execSync('./bin/rm3load -f ./tests/page-fixtures/front.json');

    query.entityFromPath(db, entity.Entity, {}, {context: "ROOT"},
      new sitepath('wh'), null, function(err, ent) {
        should.not.exist(err);
        ent.summary.title.should.equal('Welcome to rm3');
        done();
      });
  });

  it('should load from a JSON file with overriden path', function(done) {
    childProcess.execSync('./bin/rm3load -f ./tests/page-fixtures/front.json -p wh.rm3load.test1');

    query.entityFromPath(db, entity.Entity, {}, {context: "ROOT"},
      new sitepath('wh.rm3load.test1'), null, function(err, ent) {
        should.not.exist(err);
        ent.summary.title.should.equal('Welcome to rm3');
        done();
      });
  });

  it('should load from stdin with overriden path', function(done) {
    childProcess.execSync('./bin/rm3load -p wh.rm3load.test2 < ./tests/page-fixtures/front.json');

    query.entityFromPath(db, entity.Entity, {}, {context: "ROOT"},
      new sitepath('wh.rm3load.test2'), null, function(err, ent) {
        should.not.exist(err);
        ent.summary.title.should.equal('Welcome to rm3');
        done();
      });
  });
});
