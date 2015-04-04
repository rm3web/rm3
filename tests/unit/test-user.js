var entity = require ('../../lib/entity');
var user = require ('../../lib/user');
var SitePath = require ('../../lib/sitepath');
var should = require('should');

describe('user', function() {
  var e, p;
  var now = new Date();

  beforeEach(function() {
    e = new entity.Entity();
    p = new SitePath(['wh', 'unicorn', 'kitty']);
    user.createUser(e, p, 'kitty', 'unicorn', now);

  });

  it('authenticates', function(done) {

    should.deepEqual(e._path.toDottedPath(), 'wh.unicorn.kitty.kitty');
    should.deepEqual(e._proto, 'user');
    should.deepEqual(e.summary.title, 'unicorn');

    user.encodePassword('meow', e, function(err) {
      if(err) {
        should.fail();
      }
      user.authenticatePassword('meow', e, function(err) {
        if(err) {
          should.fail();
        }
        done();
      });
    });
  });
  it('catches bad passwords', function (done) {

    user.encodePassword('hiss', e, function(err) {
      if(err) {
        should.fail();
      }
      user.authenticatePassword('meow', e, function(err) {
        if(err) {
          should.deepEqual(err.name,'PasswordValidationError');
        } else {
          should.fail();
        }
        done();
      });
    });
  });
});

