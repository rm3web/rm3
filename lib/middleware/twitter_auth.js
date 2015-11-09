var Conf = require('../conf'),
    twitterConsumerKey = Conf.getCertificate('twitterConsumerKey'),
    twitterConsumerSecret = Conf.getCertificate('twitterConsumerSecret'),
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
  passport.use(new TwitterStrategy({
      consumerKey: twitterConsumerKey,
      consumerSecret: twitterConsumerSecret,
      callbackURL: "http://127.0.0.1:4000/$login/twitter/callback"
    },
    function(token, tokenSecret, profile, done) {
      /*
      User.findOrCreate(..., function(err, user) {
        if (err) { return done(err); }
        done(null, user);
      });
    */
      console.log('---------------')
      console.log(token);
      console.log('---------------')
      console.log(tokenSecret);
      console.log('---------------')
      console.log(profile);
      console.log('---------------')
      done(null);
    }
  ));
};

passport.use('twitter-authz', new TwitterStrategy({
    consumerKey: twitterConsumerKey,
    consumerSecret: twitterConsumerSecret,
    callbackURL: "http://127.0.0.1:4000/$connect/twitter/callback"
  },
  function(token, tokenSecret, profile, done) {
    console.log('---------------')
    console.log(token);
    console.log('---------------')
    console.log(tokenSecret);
    console.log('---------------')
    console.log(profile);
    console.log('---------------')
    return done(null, ['twitter', profile.id, token, tokenSecret, profile]);

    /*
    Account.findOne({ domain: 'twitter.com', uid: profile.id }, function(err, account) {
      
      if (account) { return done(null, account); }

      var account = new Account();
      account.domain = 'twitter.com';
      account.uid = profile.id;
      var t = { kind: 'oauth', token: token, attributes: { tokenSecret: tokenSecret } };
      account.tokens.push(t);
      return done(null, account);
    });
*/
  }
));

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

  app.get('/\\$connect/twitter',
    passport.authorize('twitter-authz', { failureRedirect: '/' })
  );

  app.get('/\\$connect/twitter/callback',
    passport.authorize('twitter-authz', { failureRedirect: '/' }),
    function(req, res) {
      console.log(req.user);
      console.log(req.account);
      res.redirect((req.site.sitePathToUrl(req.user.path()));

      /*
      var user = req.user;
      var account = req.account;

      // Associate the Twitter account with the logged-in user.
      account.userId = user.id;
      account.save(function(err) {
        if (err) { return self.error(err); }
        self.redirect('/');
      });
*/
    }
  );
};
