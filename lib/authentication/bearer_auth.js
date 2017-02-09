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

var boundLogger = logging.getRootLogger('bearer_auth');

function BadStoredUserId() {
  this.httpResponseCode = 403;
  this.message = "BAD_ID_IN_COOKIE";
}
i10n.intlErrorMixin(BadStoredUserId);
util.inherits(BadStoredUserId, Error);
errs.register('local_auth.bad_id', BadStoredUserId);

/**
* @overview Set up the passport connection and express routes for local password auth
* @title Local auth middlwares
* @module localAuth
*/

/**
 Passport local authentication setup.  Configures the singleton passport object
  @param {Object} db DB wrapper
  @param {Object} query Query object
  @param {Object} entity Entity class
  @param {SitePath} userpath Path to the user root
*/
exports.passportConnect = function passportConnect(db, query, entity, userpath) {
  if (!jwtSecret) {
    return;
  }
  // Use the BasicStrategy within Passport.
  //   Strategies in passport require a `verify` function, which accept
  //   credentials (in this case, a username and password), and invoke a callback
  //   with a user object.  In the real world, this would query a database;
  //   however, in this example we are using a baked-in set of users.
  passport.use(new BearerStrategy(
    function(token, done) {
      accessToken.validateAccessToken(jwtSecret, jwtIssuer, token, function(err, subject) {
        if (err) {
          return done(err);
        }
        boundLogger.info('client findByClientId', {
          subject: subject
        });
        if (!subject) {
          return done(null, false);
        }

        var subjectArr = subject.split('/');

        if (subjectArr[1]) {
          var pth = subjectArr[1].split(':')[0];
          user.findByUsername(db, {}, query, entity, userpath, pth, function(err, userRec) {
            if (err) {
              return done(err);
            }

            //TODO: Check entityID

            var info = {scope: '*'};
            return done(null, {user: userRec}, info);
          });
        } else {
          //The request came from a client only since userID is null
          //therefore the client is passed back instead of a user
          openid.db.clients.findByClientId(subjectArr[0], function(err, client) {
            if (err) {
              return done(err);
            }
            if (!client) {
              return done(null, false);
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
