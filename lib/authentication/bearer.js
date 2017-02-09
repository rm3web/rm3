var passport = require('passport'),
    BearerStrategy = require('passport-http-bearer').Strategy,
    user = require('./user'),
    util = require('util'),
    errs = require('errs'),
    logging = require('../logging'),
    i10n = require('../i10n'),
    openid = require('../openid'),
    accesstoken = require('../openid/accesstoken');

var boundLogger = logging.getRootLogger('basic_auth');

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
  // Use the BasicStrategy within Passport.
  //   Strategies in passport require a `verify` function, which accept
  //   credentials (in this case, a username and password), and invoke a callback
  //   with a user object.  In the real world, this would query a database;
  //   however, in this example we are using a baked-in set of users.
  passport.use(new BearerStrategy(
    function(accessToken, done) {
      accessToken.validateAccessToken(accessToken, function(err, subject) {
        if (err) {
          return done(err);
        }
        if (!subject) {
          return done(null, false);
        }

        var token = subject.split(':');

        if (token[1]) {
          user.findByUsername(db, {}, query, entity, userpath, token[1], function(err, userRec) {
            if (err) {
              return done(err);
            }

            var info = {scope: '*'};
            return done(null, {user: userRec}, info);
          });
        } else {
          //The request came from a client only since userID is null
          //therefore the client is passed back instead of a user
          openid.db.clients.findByClientId(token.clientID, function(err, client) {
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
