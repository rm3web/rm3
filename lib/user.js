var crypto = require('crypto'),
    Conf = require('./conf'),
    util = require('util'),
    errs = require('errs'),
    logging = require('./logging'),
    update = require('./update');
var credential = require('credential'),
    pw = credential();

var boundLogger = logging.getRootLogger('local_auth');

function PasswordValidationError() {
  this.httpResponseCode = 403;
  this.message = "Password Validation failed";
}
util.inherits(PasswordValidationError, Error);
errs.register('user.password', PasswordValidationError);

function authenticatePassword(db, ctx, query, userId, password, next) {
  query.findCredential(db, ctx, 'password', userId, function(err, identity) {
    if (err) {
      return next(err);
    }
    pw.verify(identity.providerDetails, password, function(err, isValid) {
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

function createCredential(db, ctx, email, userpath, username, password, callback) {
  pw.hash(password, function(err, pwHash) {
    if (err) {
      return callback(err);
    }
    var id = username;
    if (email) {
      id = email;
    }
    update.createCredential(db, ctx, 'password', id,
      userpath.down(username).toDottedPath(), pwHash, callback);
  });
}

function updateCredential(db, ctx, email, userpath, username, password, callback) {
  pw.hash(password, function(err, pwHash) {
    if (err) {
      return callback(err);
    }
    var id = username;
    if (email) {
      id = email;
    }
    update.updateCredential(db, ctx, 'password', id, pwHash, callback);
  });
}

exports.createUser = createUser;
exports.authenticatePassword = authenticatePassword;
exports.findByUsername = findByUsername;
exports.createCredential = createCredential;
exports.updateCredential = updateCredential;
