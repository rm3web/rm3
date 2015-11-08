var Conf = require('../conf'),
    certString = Conf.getCertificate('twitter'),
    passport = require('passport'),
    TwitterStrategy = require('passport-twitter').Strategy;

/**
* @overview Set up the passport connection and express routes for local password auth
* @title Local auth middlwares
* @module localAuth
*/

/**
 Passport local authentication setup.  Configures the singleton passport object
  @param {Object} db DB wrapper
  @param {Object} query Query object
  @param {Object} Entity Entity class
  @param {SitePath} userpath Path to the user root
*/
exports.passportConnect = function passportConnect(db, query, entity, userpath) {
  var creds = certString.split(':');

  passport.use(new TwitterStrategy({
      consumerKey: creds[0],
      consumerSecret: creds[1],
      callbackURL: "http://127.0.0.1:4000/$login/twitter/callback"
    },
    function(token, tokenSecret, profile, done) {
      /*
      User.findOrCreate(..., function(err, user) {
        if (err) { return done(err); }
        done(null, user);
      });
*/
      console.log(token);
      console.log(tokenSecret);
      console.log(profile);
      done(null);
    }
  ));
};

exports.passportPaths = function(app) {
  // Redirect the user to Twitter for authentication.  When complete, Twitter
  // will redirect the user back to the application at
  //   /auth/twitter/callback
  app.get('/\\$login/twitter', passport.authenticate('twitter'));

  // Twitter will redirect the user to this URL after approval.  Finish the
  // authentication process by attempting to obtain an access token.  If
  // access was granted, the user will be logged in.  Otherwise,
  // authentication has failed.
  app.get('/\\$login/twitter/callback',
    passport.authenticate('twitter', {successRedirect: '/',
                                      failureRedirect: '/$login/'}));
};
