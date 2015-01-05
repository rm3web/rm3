var crypto = require('crypto');
var Conf = require('./conf');
var util = require('util');
var errs = require('errs');

function PasswordValidationError() {
  this.message = "Password Validation failed";
}
util.inherits(PasswordValidationError, Error);
errs.register('user.password', PasswordValidationError);

// heavily borrowed from https://github.com/saintedlama/passport-local-mongoose
//
// We're using salted PBKDF#2 because it's fairly simple.

function encodePassword(password, entity, next) {
  crypto.randomBytes(Conf.get_security('pbkdf2_saltlen'), function(err, buf) {
    if (err) {
      return next(err);
    }
    
    var salt = buf.toString('base64');

    crypto.pbkdf2(password, salt, Conf.get_security('pbkdf2_iterations'), 
                  Conf.get_security('pbkdf2_keylen'), function(err, hashRaw) {
      if (err) {
        return next(err);
      }
      entity.data.hash = new Buffer(hashRaw, 'binary').toString('base64');
      entity.data.salt = salt;

      next(null);
    });
  });
}

function authenticatePassword(password, entity, next) {
  var self = this;
  crypto.pbkdf2(password, entity.data.salt, Conf.get_security('pbkdf2_iterations'), 
                Conf.get_security('pbkdf2_keylen'), function(err, hashRaw) {
    if (err) {
        return next(err);
    }

    var hash = new Buffer(hashRaw, 'binary').toString('base64');

    if (hash === entity.data.hash) {
      return next(null);
    } else {
      return next(errs.create('user.password', {}));
    }
  });
}

function createUser(entity, userpath, username, fullname, now) {
  entity.createNew(userpath.down(username), 'user', now);
  entity.summary.title = fullname;
}

function findByUsername(db, query, entity, userpath, username, callback) {
  // TODO : Concept of ROOT here.
  query.entity_from_path(db, entity, {}, userpath.down(username), null, callback);
}

exports.encodePassword = encodePassword;
exports.createUser = createUser;
exports.authenticatePassword = authenticatePassword;
exports.findByUsername = findByUsername;