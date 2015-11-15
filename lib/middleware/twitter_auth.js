var Conf = require('../conf'),
    twitterConsumerKey = Conf.getCertificate('twitterConsumerKey'),
    twitterConsumerSecret = Conf.getCertificate('twitterConsumerSecret'),
    passport = require('passport'),
    TwitterStrategy = require('passport-twitter').Strategy,
    update = require ('../update'),
    user = require('../user');

/**
* @overview Set up the passport connection and express routes for
* auth using Twitter
* @title Twitter auth middlwares
* @module twitterAuth
*/

function censorProfile(profile) {
  // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
  return {
    id: profile.id,
    id_str: profile.id_str,
    name: profile.name,
    screen_name: profile.screen_name,
    created_at: profile.created_at,
    suspended: profile.suspended
  };
  // jscs:enable
}

/**
 Passport twitter authentication setup.  Configures the singleton passport object
  @param {Object} db DB wrapper
  @param {Object} query Query object
  @param {Object} Entity Entity class
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
    },
    function(token, tokenSecret, profile, done) {
      query.findIdentity(db, {}, 'twitter', profile.id, function(err, rec) {
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
          return done(null, userRec);
        });
      });
    }
  ));
  passport.use('twitter-authz', new TwitterStrategy({
      consumerKey: twitterConsumerKey,
      consumerSecret: twitterConsumerSecret,
      callbackURL: "http://127.0.0.1:4000/$connect/twitter/callback"
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
    }
  ));
};

exports.passportPaths = function(db, app) {
  if (!twitterConsumerKey) {
    return;
  }
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
  app.get('/\\$connect/twitter',
    passport.authorize('twitter-authz', {failureRedirect: '/'})
  );

  app.get('/\\$connect/twitter/callback',
    passport.authorize('twitter-authz', {failureRedirect: '/'}),
    function(req, res) {
      update.createIdentity(db, req.ctx, req.account.provider, req.account.userId,
        req.user.path().toDottedPath(), req.account.providerDetails, function(err) {
          if (err) {
            console.log(err);
            return res.redirect('/');
          }
          return res.redirect(req.site.sitePathToUrl(req.user.path()));
        });
    }
  );
};
