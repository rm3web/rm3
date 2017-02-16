var jwt = require('jsonwebtoken');

exports.generateAccessToken = function(jwtSecret, jwtIssuer, jwtExpiresSeconds, subject, next) {
  jwt.sign({}, jwtSecret, {
    audience: '127.0.0.1/accessToken',
    subject: subject,
    issuer: jwtIssuer,
    expiresIn: jwtExpiresSeconds
  }, function(err, accessToken) {

    return next(err, accessToken);
  });
};

exports.validateAccessToken = function(jwtSecret, jwtIssuer, jwtExpiresSeconds, accessToken, next) {
  jwt.verify(accessToken, jwtSecret, {
    audience: '127.0.0.1/accessToken',
    issuer: jwtIssuer,
    maxAge: jwtExpiresSeconds
  }, function(err, decoded) {
    if (err) {
      return next(err);
    }
    return next(err, decoded.sub);
  });
};
