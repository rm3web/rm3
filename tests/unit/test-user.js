var entity = require ('../../lib/entity');
var user = require ('../../lib/user');
var test = require('tape');
var SitePath = require ('../../lib/sitepath');

test('user', function (t) {

  t.plan(4);

  var e = new entity.Entity();
  var now = new Date();
  var p = new SitePath(['wh', 'unicorn', 'kitty']);

  user.createUser(e, p, 'kitty', 'unicorn', now);

  t.deepEqual(e._path.toDottedPath(), 'wh.unicorn.kitty.kitty');
  t.deepEqual(e._proto, 'user');
  t.deepEqual(e.summary.title, 'unicorn');

  user.encodePassword('meow', e, function(err) {
    if(err) {
      t.fail();
    }
    user.authenticatePassword('meow', e, function(err) {
      if(err) {
        t.fail();
      }
      t.pass();
      t.end();
    });
  });
});

test('user badpass', function (t) {

  t.plan(2);

  var e = new entity.Entity();
  var now = new Date();
  var p = new SitePath(['wh', 'unicorn', 'kitty']);

  user.createUser(e, p, 'kitty', 'unicorn', now);

  user.encodePassword('hiss', e, function(err) {
    if(err) {
      t.fail();
    }
    user.authenticatePassword('meow', e, function(err) {
      if(err) {
        t.pass();
        t.deepEqual(err.name,'PasswordValidationError');
      } else {
        t.fail();
      }
      t.end();
    });
  });
});