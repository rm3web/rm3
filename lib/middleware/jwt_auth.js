var Conf = require('../conf'),
    jwtSecret = Conf.getCertificate('jwtSecret'),
    jwtIssuer = Conf.getCertificate('jwtIssuer'),
    passport = require('passport'),
    JwtStrategy = require('passport-jwt').Strategy,
    user = require('../user');

/**
* @overview Set up the passport connection and express routes for
* auth using JWT
* @title JWT auth middlwares
* @module jwtAuth
*/

/**
 Passport twitter authentication setup.  Configures the singleton passport object
  @param {Object} db DB wrapper
  @param {Object} query Query object
  @param {Object} entity Entity class
  @param {SitePath} userpath Path to the user root
*/
exports.passportConnect = function passportConnect(db, query, entity, userpath) {

  if (!jwtSecret) {
    return;
  }
  var opts = {};
  opts.secretOrKey = jwtSecret;
  opts.issuer = jwtIssuer;
  opts.audience = "127.0.0.1";
  passport.use(new JwtStrategy(opts, function(jwtPayload, done) {
    user.findByUsername(db, {}, query, entity, userpath, jwtPayload.sub, function(err, userRec) {
      if (err) {
        return done(err, false);
      }
      done(null, {user: userRec});
    });
  }));
};

