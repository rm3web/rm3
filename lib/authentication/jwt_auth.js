var Conf = require('../conf'),
    passport = require('passport'),
    async = require('async'),
    JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt,
    user = require('./user'),
    logging = require('../logging'),
    accessToken = require('./accesstoken');

var boundLogger = logging.getRootLogger('authentication.jwt_auth');

var jwtSecret = Conf.getCertificate('jwtSecret');
var jwtIssuer = Conf.getCertificate('jwtIssuer');
var jwtAudienceRoot = Conf.getCertificate('jwtAudienceRoot');
var jwtExpiresSeconds = Conf.getConfig('jwtExpiresSeconds');
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
  opts.jwtFromRequest = ExtractJwt.versionOneCompatibility({ });
  opts.secretOrKey = jwtSecret;
  opts.issuer = jwtIssuer;
  opts.audience = jwtAudienceRoot + '/accessToken';
  opts.maxAge = jwtExpiresSeconds;
  passport.use(new JwtStrategy(opts, function(jwtPayload, done) {
    async.parallel([
      accessToken.validateClientAudience.bind(this, db, query, entity, userpath, jwtPayload.sub),
      accessToken.validateUserAudience.bind(this, db, query, entity, userpath, jwtPayload.sub)
    ], function(err, results) {
      if (err) {
        return logging.logAndWrapError(boundLogger, err,
          'validateUserAudience error', 'authentication.bearer_auth.bad_id', {
          }, done);
      }
      var info = {scope: '*'};
      var data = {client: results[0]};
      if (results[1]) {
        data.user = results[1];
      }
      return done(err, data, info);
    });
  }));
};

