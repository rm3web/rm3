var Conf = require ('../../lib/conf');
var should = require('should');
var childProcess = require('child_process');

var db = require('../../lib/db');
var entity = require('../../lib/entity');
var sitepath = require ('sitepath');
var query = require('../../lib/query');

describe('rm3admin', function() {
  this.timeout(12000); // This might take a bit of time
  it('should add a permission to a role and roleinfo should check', function() {
    childProcess.execSync('./bin/rm3admin permit root edit \\*');

    var output = childProcess.execSync('./bin/rm3admin roleinfo root').toString();

    output.should.match(/Permission: edit\tPath */);
    output.should.match(/Permissions for role root:/);
  });

  it('should add a user', function(done) {
    childProcess.execSync('./bin/rm3admin adduser ponies omgponies');

    query.entityFromPath(db, entity.Entity, {}, {context: "ROOT"},
      new sitepath('wh.users.ponies'), null, function(err, ent) {
        should.not.exist(err);
        ent.summary.title.should.equal('omgponies');
        ent._proto.should.equal('user');
        done();
      });
  });

  it('should assign a user to a role', function() {
    childProcess.execSync('./bin/rm3admin adduser kittens omgkittens');
    childProcess.execSync('./bin/rm3admin assign kittens root');

    var output = childProcess.execSync('./bin/rm3admin roleusers root').toString();

    output.should.match(/wh.users.kittens/);
    output.should.match(/Users in role root:/);
  });

});
