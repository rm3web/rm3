var jwt = require('jsonwebtoken');

exports.generateAuthorizationCode = function(jwtSecret, jwtIssuer, clientId, userId, redirectUri, next) {
  jwt.sign({
    redirectUri: redirectUri,
    userId: userId
  }, jwtSecret, {
    audience: '127.0.0.1/authorization/' + userId,
    subject: clientId,
    issuer: jwtIssuer
  }, function(err, authorizationCode) {
    return next(err, authorizationCode);
  });
};

exports.validateAuthorizationCode = function(jwtSecret, jwtIssuer, authorizationCode) {

};
