var user = require('./user'),
    util = require('util'),
    errs = require('errs'),
    logging = require('../logging'),
    Conf = require('../conf'),
    openid = require('../openid'),
    boundLogger = logging.getRootLogger('authentication.accesstoken');

var jwt = require('jsonwebtoken');

function EntityIdMismatch() {
  this.message = "Entity ID Mismatch";
}
util.inherits(EntityIdMismatch, Error);
errs.register('authentication.accesstoken.bad_entity_id', EntityIdMismatch);

function TokenSubjectMissing() {
  this.message = "Token Subject Missing";
}
util.inherits(TokenSubjectMissing, Error);
errs.register('authentication.accesstoken.subject_missing', TokenSubjectMissing);

exports.generateAccessToken = function(jwtSecret, jwtIssuer, jwtAudienceRoot, jwtExpiresSeconds, subject, next) {
  jwt.sign({}, jwtSecret, {
    audience: jwtAudienceRoot + '/accessToken',
    subject: subject,
    issuer: jwtIssuer,
    expiresIn: jwtExpiresSeconds
  }, function(err, accessToken) {
    return next(err, accessToken);
  });
};

exports.validateAccessToken = function(jwtSecret, jwtIssuer, jwtAudienceRoot, jwtExpiresSeconds, accessToken, next) {
  jwt.verify(accessToken, jwtSecret, {
    audience: jwtAudienceRoot + '/accessToken',
    issuer: jwtIssuer,
    maxAge: jwtExpiresSeconds
  }, function(err, decoded) {
    if (err) {
      return next(err);
    }
    if (!decoded.sub) {
      return logging.logAndCreateError(boundLogger,
        'bad subject', 'authentication.accesstoken.subject_missing', {
        }, next);
    }
    return next(err, decoded.sub);
  });
};

exports.validateUserAudience = function(db, query, entity, userpath, subject, next) {
  var subjectArr = subject.split('/');

  if (subjectArr[1]) {
    var pth = subjectArr[1].split(':')[0];
    user.findByUsername(db, {}, query, entity, userpath, pth, function(err, userRec) {
      if (err) {
        return next(err);
      }
      var entityId = subjectArr[1].split(':')[1];
      if (userRec._entityId === entityId) {
        return next(null, userRec);
      } else {
        logging.logAndCreateError(boundLogger,
          'validateUserAudience token entityId does not match',
          'authentication.accesstoken.bad_entity_id', {
            username: pth,
            entityId1: userRec._entityId,
            entityId2: entityId
          }, next);
      }
    });
  } else {
    next(null, null);
  }
};

exports.validateClientAudience = function(db, query, entity, userpath, subject, next) {
  var subjectArr = subject.split('/');
  query.findServiceAccount(db, {}, 'openid', subjectArr[0], function(err, client) {
    if (err) {
      return next(err);
    }
    next(null, client);
  });
};
