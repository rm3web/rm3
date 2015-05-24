var crypto = require('crypto'),
    Conf = require('./conf'),
    util = require('util'),
    errs = require('errs'),
    logging = require('./logging');

var boundLogger = logging.getRootLogger('local_auth');

function PasswordValidationError() {
  this.httpResponseCode = 403;
  this.message = "Password Validation failed";
}
util.inherits(PasswordValidationError, Error);
errs.register('user.password', PasswordValidationError);

// heavily borrowed from https://github.com/saintedlama/passport-local-mongoose
//
// We're using salted PBKDF#2 because it's fairly simple.

function encodePassword(password, entity, next) {
  crypto.randomBytes(Conf.getSecurity('pbkdf2Saltlen'), function(err, buf) {
    if (err) {
      return next(err);
    }

    var salt = buf.toString('base64');

    crypto.pbkdf2(password, salt, Conf.getSecurity('pbkdf2Iterations'),
                  Conf.getSecurity('pbkdf2Keylen'), function(err, hashRaw) {
      if (err) {
        return next(err);
      }
      entity.data.secrets = {};
      entity.data.secrets.hash = new Buffer(hashRaw, 'binary').toString('base64');
      entity.data.secrets.salt = salt;

      next(null);
    });
  });
}

function authenticatePassword(password, entity, next) {
  var self = this;
  crypto.pbkdf2(password, entity.data.secrets.salt, Conf.getSecurity('pbkdf2Iterations'),
                Conf.getSecurity('pbkdf2Keylen'), function(err, hashRaw) {
    if (err) {
      return logging.logAndCreateError(boundLogger, 
        'authenticatePassword', 'user.password', {
          underlying: err
        }, next);
    }

    var hash = new Buffer(hashRaw, 'binary').toString('base64');

    if (hash === entity.data.secrets.hash) {
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

function findByUsername(db, ctx, query, entity, userpath, username, callback) {
  var security = {context: 'USERLOOKUP'};
  query.entityFromPath(db, entity, ctx, security, userpath.down(username), null, 
    function(err, userRec) {
      if (err) {
        return logging.logAndCreateError(boundLogger, 
          'findByUsername invalid username', 'user.password', {
            ctx: ctx,
            userpath: userpath,
            username: username,
            underlying: err
          }, callback);
      }
      callback(err, userRec);
    });
}

exports.encodePassword = encodePassword;
exports.createUser = createUser;
exports.authenticatePassword = authenticatePassword;
exports.findByUsername = findByUsername;
