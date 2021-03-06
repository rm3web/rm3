var jwt = require('jsonwebtoken');

exports.generateAuthorizationCode = function(jwtSecret, jwtIssuer, jwtAudienceRoot, jwtExpiresSeconds, clientId, userId, redirectUri, next) {
  jwt.sign({
    redirectUri: redirectUri,
    userId: userId
  }, jwtSecret, {
    audience: jwtAudienceRoot + '/authorization/' + userId,
    subject: clientId,
    issuer: jwtIssuer,
    expiresIn: jwtExpiresSeconds
  }, function(err, authorizationCode) {
    return next(err, authorizationCode);
  });
};

exports.validateAuthorizationCode = function(jwtSecret, jwtIssuer, jwtAudienceRoot, jwtExpiresSeconds, authorizationCode, clientId, next) {
  jwt.verify(authorizationCode, jwtSecret, {
    subject: clientId,
    issuer: jwtIssuer,
    maxAge: jwtExpiresSeconds
  }, function(err, decoded) {
    if (err) {
      return next(err);
    }
    return next(err, decoded);
  });
};
