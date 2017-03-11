var passport = require('passport'),
    BearerStrategy = require('passport-http-bearer').Strategy,
    user = require('./user'),
    util = require('util'),
    errs = require('errs'),
    logging = require('../logging'),
    Conf = require('../conf'),
    async = require('async'),
    i10n = require('../i10n'),
    accessToken = require('./accesstoken');

var jwtSecret = Conf.getCertificate('jwtSecret');
var jwtIssuer = Conf.getCertificate('jwtIssuer');
var jwtAudienceRoot = Conf.getCertificate('jwtAudienceRoot');
var jwtExpiresSeconds = Conf.getConfig('jwtExpiresSeconds');

var boundLogger = logging.getRootLogger('authentication.bearer_auth');

function BadBearerAuth() {
  this.httpResponseCode = 401;
  this.message = "AUTH_FAILED";
}
i10n.intlErrorMixin(BadBearerAuth);
util.inherits(BadBearerAuth, Error);
errs.register('authentication.bearer_auth.bad_id', BadBearerAuth);

/**
* @overview Set up the passport connection for bearer token auth
* @title Bearer token middlwares
* @module bearerAuth
*/

/**
 Passport bearer authentication setup.  Configures the singleton passport object
  @param {Object} db DB wrapper
  @param {Object} query Query object
  @param {Object} entity Entity class
  @param {SitePath} userpath Path to the user root
*/
exports.passportConnect = function passportConnect(db, query, entity, userpath) {
  if (!jwtSecret) {
    return;
  }
  passport.use(new BearerStrategy(
    function(token, done) {
      accessToken.validateAccessToken(jwtSecret, jwtIssuer, jwtAudienceRoot, jwtExpiresSeconds, token, function(err, subject) {
        boundLogger.info('validate token', {
          subject: subject
        });
        if (err) {
          return logging.logAndWrapError(boundLogger, err,
            'validateAccessToken error', 'authentication.bearer_auth.bad_id', {
            }, done);
        }
        async.parallel([
          accessToken.validateClientAudience.bind(this, db, query, entity, userpath, subject),
          accessToken.validateUserAudience.bind(this, db, query, entity, userpath, subject)
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
      });
    }
  ));
};
