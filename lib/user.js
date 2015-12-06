var crypto = require('crypto'),
    Conf = require('./conf'),
    util = require('util'),
    errs = require('errs'),
    logging = require('./logging'),
    pw = require('credential');

var boundLogger = logging.getRootLogger('local_auth');

function PasswordValidationError() {
  this.httpResponseCode = 403;
  this.message = "Password Validation failed";
}
util.inherits(PasswordValidationError, Error);
errs.register('user.password', PasswordValidationError);

function encodePassword(password, entity, next) {
  pw.hash(password, function(err, hashRaw) {
    if (err) {
      return next(err);
    }
    if (!entity.data.hasOwnProperty('secrets')) {
      entity.data.secrets = {};
    }
    entity.data.secrets.credential = hashRaw;
    next(null);
  });
}

function authenticatePassword(password, entity, next) {
  var self = this;
  if (entity.data.secrets.credential) {
    pw.verify(entity.data.secrets.credential, password, function(err, isValid) {
      if (err) {
        return logging.logAndCreateError(boundLogger,
          'authenticatePassword', 'user.password', {
            underlying: err
          }, next);
      }
      if (isValid) {
        return next(null);
      } else {
        return next(errs.create('user.password', {}));
      }
    });
  }
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
