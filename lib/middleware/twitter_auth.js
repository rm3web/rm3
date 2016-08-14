var Conf = require('../conf'),
    twitterConsumerKey = Conf.getCertificate('twitterConsumerKey'),
    twitterConsumerSecret = Conf.getCertificate('twitterConsumerSecret'),
    passport = require('passport'),
    TwitterStrategy = require('passport-twitter').Strategy,
    update = require ('../update'),
    user = require('../user'),
    RateLimiter = require("rolling-rate-limiter");
    Redis = require("redis");
    sessionRedisClient = Redis.createClient(Conf.getEndpoint('sessionRedis'));


var limiter = RateLimiter({
  redis: sessionRedisClient,
  namespace: "UserLoginLimiter",
  interval: 100000,
  maxInInterval: 10,
  minDifference: 100,
});

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

exports.passportPaths = function(db, app) {
  if (!twitterConsumerKey) {
    return;
  }

  app.post('/\\$login/twitter', function(req, res, next) {
    // "req.ipAddress" could be replaced with any unique user identifier 
    // Note that the limiter returns the number of miliseconds until an action 
    // will be allowed.  Since 0 is falsey, this can be treated as a boolean. 
    limiter(req.ipAddress, function(err, timeLeft) {
      if (err) {
        return res.status(500).send();
      } else if (timeLeft) {
        return res.status(429).send("You must wait " + timeLeft + " ms before you can make requests.");
      } else {
        return next();
      }
    });
  })
  
  // Redirect the user to Twitter for authentication.  When complete, Twitter
  // will redirect the user back to the application at
  //   /$login/twitter/callback
  app.get('/\\$login/twitter', passport.authenticate('twitter'));

  // Twitter will redirect the user to this URL after approval.  Finish the
  // authentication process by attempting to obtain an access token.  If
  // access was granted, the user will be logged in.  Otherwise,
  // authentication has failed.
  app.get('/\\$login/twitter/callback',
    passport.authenticate('twitter', {successRedirect: '/',
                                      failureRedirect: '/$login/'}));

  // Redirect the user to Twitter to connect .  When complete, Twitter
  // will redirect the user back to the application at
  //   /$login/twitter/callback
  app.get('/\\$login/twitter/connect',
    passport.authorize('twitter-authz', {failureRedirect: '/'})
  );

  app.get('/\\$login/twitter/authorize',
    passport.authorize('twitter-authz', {failureRedirect: '/'}),
    function(req, res) {
      update.createCredential(db, req.ctx, req.account.provider, req.account.userId,
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
