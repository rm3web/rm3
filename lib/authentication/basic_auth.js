var passport = require('passport'),
    BasicStrategy = require('passport-http').BasicStrategy,
    util = require('util'),
    errs = require('errs'),
    logging = require('../logging'),
    i10n = require('../i10n'),
    openid = require('../openid');

var boundLogger = logging.getRootLogger('authentication.basic_auth');

function BadBasicAuth() {
  this.status = 401;
  this.httpResponseCode = 401;
  this.message = "Auth Failed";
}
util.inherits(BadBasicAuth, Error);
errs.register('authentication.basic_auth.bad_id', BadBasicAuth);

/**
* @overview Set up the passport connection and express routes for HTTP Basic Auth
* @title Local auth middlwares
* @module localAuth
*/

/**
 Passport HTTP Basic Auth authentication setup.  Configures the singleton passport object
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
  passport.use(new BasicStrategy(
    function(username, password, done) {
      boundLogger.info('basicAuth', {
        username: username
      });
      query.findServiceAccount(db, {}, 'openid', username, function(err, client) {
        if (err) {
          return logging.logAndWrapError(boundLogger, err,
            'findByClientId error', 'authentication.basic_auth.bad_id', {
              username: username
            }, done);
        }
        if (!client) {
          return logging.logAndCreateError(boundLogger,
            'clientNotFound', 'authentication.basic_auth.bad_id', {
              username: username
            }, done);
        }
        if (client.providerDetails.secret != password) {
          return logging.logAndCreateError(boundLogger,
            'clientSecret', 'authentication.basic_auth.bad_id', {
              username: username
            }, done);
        }
        boundLogger.info('basicAuth OK', {
          username: username
        });
        return done(null, client);
      });
    }
  ));
};
