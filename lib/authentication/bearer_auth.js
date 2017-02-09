var passport = require('passport'),
    BearerStrategy = require('passport-http-bearer').Strategy,
    user = require('./user'),
    util = require('util'),
    errs = require('errs'),
    logging = require('../logging'),
    Conf = require('../conf'),
    i10n = require('../i10n'),
    openid = require('../openid'),
    accessToken = require('../openid/accesstoken');

var jwtSecret = Conf.getCertificate('jwtSecret');
var jwtIssuer = Conf.getCertificate('jwtIssuer');

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
      accessToken.validateAccessToken(jwtSecret, jwtIssuer, token, function(err, subject) {
        if (err) {
          return logging.logAndWrapError(boundLogger, err,
            'validateAccessToken error', 'authentication.bearer_auth.bad_id', {
            }, done);
        }
        if (!subject) {
          return logging.logAndCreateError(boundLogger,
            'bad subject', 'authentication.bearer_auth.bad_id', {
            }, done);
        }
        boundLogger.info('validate token', {
          subject: subject
        });
        var subjectArr = subject.split('/');

        if (subjectArr[1]) {
          var pth = subjectArr[1].split(':')[0];
          user.findByUsername(db, {}, query, entity, userpath, pth, function(err, userRec) {
            if (err) {
              return logging.logAndWrapError(boundLogger, err,
                'findByUsername error', 'authentication.bearer_auth.bad_id', {
                  username: pth
                }, done);
            }
            var entityId = subjectArr[1].split(':')[1];
            if (userRec._entityId === entityId) {
              var info = {scope: '*'};
              return done(null, {user: userRec}, info);
            } else {
              logging.logAndCreateError(boundLogger,
                'deserializeUser entityId and token don\'t match',
                'authentication.bearer_auth.bad_id', {
                  entityId: user._entityId,
                  id: id
                });
            }
          });
        } else {
          //The request came from a client only since userID is null
          //therefore the client is passed back instead of a user
          openid.db.clients.findByClientId(subjectArr[0], function(err, client) {
            if (err) {
              return logging.logAndWrapError(boundLogger, err,
                'findByUsername error', 'authentication.bearer_auth.bad_id', {
                  username: pth
                }, done);
            }
            if (!client) {
              return logging.logAndCreateError(boundLogger,
                'bad subject', 'authentication.bearer_auth.bad_id', {
                }, done);
            }
            // to keep this example simple, restricted scopes are not implemented,
            // and this is just for illustrative purposes
            var info = {scope: '*'};
            done(null, client, info);
          });
        }
      });
    }
  ));
};
