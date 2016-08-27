var Conf = require('../conf'),
    twitterConsumerKey = Conf.getCertificate('twitterConsumerKey'),
    twitterConsumerSecret = Conf.getCertificate('twitterConsumerSecret'),
    passport = require('passport'),
    TwitterStrategy = require('passport-twitter').Strategy,
    update = require ('../update'),
    user = require('./user'),
    requireHttps = require('require-https');

/**
* @overview Set up the passport connection and express routes for
* auth using Twitter
* @title Twitter auth middlwares
* @module twitterAuth
*/

function censorProfile(profile) {
  /* eslint-disable camelcase */
  return {
    id: profile.id,
    id_str: profile.id_str,
    name: profile.name,
    screen_name: profile.screen_name,
    created_at: profile.created_at,
    suspended: profile.suspended
  };
  /* eslint-enable camelcase */
}

/**
 Passport twitter authentication setup.  Configures the singleton passport object
  @param {Object} db DB wrapper
  @param {Object} query Query object
  @param {Object} entity Entity class
  @param {SitePath} userpath Path to the user root
*/
exports.passportConnect = function passportConnect(db, query, entity, userpath) {
  if (!twitterConsumerKey) {
    return;
  }
  passport.use(new TwitterStrategy({
    consumerKey: twitterConsumerKey,
    consumerSecret: twitterConsumerSecret,
    callbackURL: "http://127.0.0.1:4000/$login/twitter/callback"
  }, function(token, tokenSecret, profile, done) {
    query.findCredential(db, {}, 'twitter', profile.id, function(err, rec) {
      if (err) {
        return done(err);
      }
      if (userpath.toDottedPath() != rec.userPath.up().toDottedPath()) {
        return done(new Error('Extraneous bad path'));
      }
      user.findByUsername(db, {}, query, entity, userpath, rec.userPath.leaf(), function(err, userRec) {
        if (err) {
          return done(err);
        }
        return done(null, {user: userRec});
      });
    });
  }));
  passport.use('twitter-authz', new TwitterStrategy({
    consumerKey: twitterConsumerKey,
    consumerSecret: twitterConsumerSecret,
    callbackURL: "http://127.0.0.1:4000/$login/twitter/authorize"
  },
  function(token, tokenSecret, profile, done) {
    return done(null, {
      provider: 'twitter',
      userId: profile.id,
      providerDetails: {
        token: token,
        tokenSecret: tokenSecret,
        profile: censorProfile(profile)
      }
    });
  }));
};

exports.passportPaths = function(app) {
  if (!twitterConsumerKey) {
    return;
  }

  if (!Conf.getConfig('disableHttpsChecks')) {
    app.post('/twitter', requireHttps(403, 'HTTPS is required to log in.'));
    app.get('/twitter', requireHttps(403, 'HTTPS is required to log in.'));
    app.get('/twitter/connect', requireHttps(403, 'HTTPS is required to log in.'));
    app.get('/twitter/callback', requireHttps(403, 'HTTPS is required to log in.'));
    app.get('/twitter/authorize', requireHttps(403, 'HTTPS is required to log in.'));
  }

  app.post('/twitter', function(req, res, next) {
    req.rateLimiter.userLogin(req.ipAddress, function(err, timeLeft) {
      if (err) {
        return res.status(500).send();
      } else if (timeLeft) {
        return res.status(429).send("You must wait " + timeLeft + " ms before you can make requests.");
      } else {
        return next();
      }
    });
  });

  // Redirect the user to Twitter for authentication.  When complete, Twitter
  // will redirect the user back to the application at
  //   /$login/twitter/callback
  app.get('/twitter', passport.authenticate('twitter'));

  // Twitter will redirect the user to this URL after approval.  Finish the
  // authentication process by attempting to obtain an access token.  If
  // access was granted, the user will be logged in.  Otherwise,
  // authentication has failed.
  app.get('/twitter/callback',
    passport.authenticate('twitter', {successRedirect: '/',
                                      failureRedirect: '/$login/'}));

  // Redirect the user to Twitter to connect .  When complete, Twitter
  // will redirect the user back to the application at
  //   /$login/twitter/callback
  app.get('/twitter/connect',
    passport.authorize('twitter-authz', {failureRedirect: '/'})
  );

  app.get('/twitter/authorize',
    passport.authorize('twitter-authz', {failureRedirect: '/'}),
    function(req, res) {
      update.createCredential(req.db, req.ctx, req.account.provider, req.account.userId,
        req.user.user.path().toDottedPath(), req.account.providerDetails, function(err) {
          if (err) {
            console.log(err);
            return res.redirect('/');
          }
          return res.redirect(req.site.sitePathToUrl(req.user.user.path()));
        });
    }
  );
};
