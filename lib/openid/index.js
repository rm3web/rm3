var express = require('express'),
    passport = require('passport'),
    oauth2orize = require('oauth2orize'),
    csurf = require('csurf'),
    user = require('../authentication/user'),
    util = require('util'),
    errs = require('errs'),
    view = require('../view'),
    login = require('connect-ensure-login'),
    logging = require('../logging'),
    SitePath = require('sitepath'),
    Conf = require('../conf'),
    accessToken = require('../authentication/accesstoken'),
    authorizationCode = require('./authorizationcode');

var router = express.Router();
var boundLogger = logging.getRootLogger('openid');
var csrfProtection = csurf();
var jwtSecret = Conf.getCertificate('jwtSecret');
var jwtIssuer = Conf.getCertificate('jwtIssuer');
var jwtAudienceRoot = Conf.getCertificate('jwtAudienceRoot');
var jwtExpiresSeconds = Conf.getConfig('jwtExpiresSeconds');
var server;

function BadRedirectUri() {
  this.status = 400;
  this.httpResponseCode = 400;
  this.message = "Bad redirect URI";
}
util.inherits(BadRedirectUri, Error);
errs.register('openid.bad_id', BadRedirectUri);

function InvalidOauthDetails() {
  this.status = 400;
  this.httpResponseCode = 400;
  this.message = "Invalid OAuth details";
}
util.inherits(InvalidOauthDetails, Error);
errs.register('openid.bad', InvalidOauthDetails);

var ldb = {};

ldb.userHasToken = function(userPath, clientPath) {
  return false;
};

ldb.clientIsTrusted = function(clientPath) {
  return false;
};

exports.openidConnect = function openidConnect(db, query, entity) {
  if (!jwtSecret) {
    router.use(function(req, res, next) {
      res.status(404).send('404: Page not Found');
    });
    return;
  }
  server = oauth2orize.createServer();
  query.getSiteConfig(db, {}, 'default', 'sitepath', function(err, config) {
    var userpath = new SitePath(['wh', 'users']);
    if (!err) {
      userpath = new SitePath(config.root).down('users');
    }

    // When a client redirects a user to user authorization endpoint, an
    // authorization transaction is initiated.  To complete the transaction, the
    // user must authenticate and approve the authorization request.  Because this
    // may involve multiple HTTP request/response exchanges, the transaction is
    // stored in the session.
    //
    // An application must supply serialization functions, which determine how the
    // client object is serialized into the session.  Typically this will be a
    // simple matter of serializing the client's ID, and deserializing by finding
    // the client by ID from the database.
    server.serializeClient(function(client, done) {
      boundLogger.info('serializeClient', {
        id: client.id
      });
      return done(null, client.clientId);
    });

    server.deserializeClient(function(id, done) {
      boundLogger.info('deserializeClient', {
        id: id
      });
      query.findServiceAccount(db, {}, 'openid', id, function(err, client) {
        if (err) {
          return logging.logAndWrapError(boundLogger, err,
            'findServiceAccount client', 'openid.bad', {
              client: client
            }, done);
        }
        return done(null, client);
      });
    });

    // Grant authorization codes.  The callback takes the `client` requesting
    // authorization, the `redirectURI` (which is used as a verifier in the
    // subsequent exchange), the authenticated `user` granting access, and
    // their response, which contains approved scope, duration, etc. as parsed by
    // the application.  The application issues a code, which is bound to these
    // values, and will be exchanged for an access token.
    server.grant(oauth2orize.grant.code(function(client, redirectUri, user, ares, done) {
      boundLogger.info('grant authorization code', {
        client: client,
        redirectUri: redirectUri,
        user: user,
        ares: ares
      });

      authorizationCode.generateAuthorizationCode(jwtSecret, jwtIssuer, jwtAudienceRoot, jwtExpiresSeconds, client.id, user.id, redirectUri, function(err, code) {
        if (err) {
          console.log('gac');
          console.log(err);
          return done(err);
        }
        done(null, code);
      });
    }));

    // Grant implicit authorization.  The callback takes the `client` requesting
    // authorization, the authenticated `user` granting access, and
    // their response, which contains approved scope, duration, etc. as parsed by
    // the application.  The application issues a token, which is bound to these
    // values.
    server.grant(oauth2orize.grant.token(function(client, user, ares, done) {
      boundLogger.info('grant implicit authorization token', {
        client: client,
        user: user,
        ares: ares
      });

      var clientId = client.clientId + "/" + user.id;
      accessToken.generateAccessToken(jwtSecret, jwtIssuer, jwtAudienceRoot, jwtExpiresSeconds, clientId, function(err, token) {
        if (err) {
          console.log('gat');
          console.log(err);
          return done(err);
        }
        var now = new Date();
        var exp = new Date(now.getTime() + jwtExpiresSeconds * 1000);
        /* eslint-disable camelcase */
        return done(null, token, null, {expires_at: exp});
        /* eslint-enable camelcase */
      });
    }));

    // Exchange authorization codes for access tokens.  The callback accepts the
    // `client`, which is exchanging `code` and any `redirectURI` from the
    // authorization request for verification.  If these values are validated, the
    // application issues an access token on behalf of the user who authorized the
    // code.

    server.exchange(oauth2orize.exchange.code(function(client, code, redirectUri, done) {
      boundLogger.info('exchange authorization code for access token', {
        client: client,
        redirectUri: redirectUri
      });
      authorizationCode.validateAuthorizationCode(jwtSecret, jwtIssuer, jwtAudienceRoot, jwtExpiresSeconds, code, client.id, function(err, authCode) {
        boundLogger.info('validateAuthorizationCode', {
          client: client
        });
        if (err) {
          return logging.logAndWrapError(boundLogger, err,
            'exchange.code validateAuthorizationCode client', 'openid.bad', {
              client: client
            }, done);
        }
        if (redirectUri !== authCode.redirectUri) {
          return logging.logAndCreateError(boundLogger,
            'bad redirectURI', 'openid.bad_id', {
              redirectUri: redirectUri
            }, done);
        }

        var clientId = authCode.sub + "/" + authCode.userId;
        accessToken.generateAccessToken(jwtSecret, jwtIssuer, jwtAudienceRoot, jwtExpiresSeconds, clientId, function(err, token) {
          if (err) {
            console.log('desgag');
            console.log(err);
            return done(err);
          }
          var now = new Date();
          var exp = new Date(now.getTime() + jwtExpiresSeconds * 1000);
          /* eslint-disable camelcase */
          return done(null, token, null, {expires_at: exp});
          /* eslint-enable camelcase */
        });
      });
    }));

    // Exchange user id and password for access tokens.  The callback accepts the
    // `client`, which is exchanging the user's name and password from the
    // authorization request for verification. If these values are validated, the
    // application issues an access token on behalf of the user who authorized the code.

    server.exchange(oauth2orize.exchange.password(function(client, username, password, scope, done) {
      boundLogger.info('exchange pw for access token', {
        client: client,
        username: username,
        password: password,
        scope: scope
      });

      //Validate the client
      query.findServiceAccount(db, {}, 'openid', client.clientId, function(err, localClient) {
        if (err) {
          return logging.logAndWrapError(boundLogger, err,
            'exchange.password findServiceAccount client', 'openid.bad', {
              client: client
            }, done);
        }
        if (localClient === null) {
          return done(null, false);
        }
        if (localClient.providerDetails.clientSecret !== client.clientSecret) {
          return done(null, false);
        }
        //Validate the user
        user.findByUsername(db, {}, query, entity, userpath, username, function(err, userRec) {
          if (err) {
            return logging.logAndWrapError(boundLogger, err,
              'exchange.password findByUsername user', 'openid.bad', {
                username: username
              }, done);
          }
          user.authenticatePassword(db, {}, query, userRec.data.email, password, function(err) {
            if (err) {
              return logging.logAndWrapError(boundLogger, err,
                'exchange.password authenticatePassword user', 'openid.bad', {
                  username: username
                }, done);
            } else {
              var clientId = client.clientId + '/' + userRec.path().leaf() + ':' + userRec._entityId;
              accessToken.generateAccessToken(jwtSecret, jwtIssuer, jwtAudienceRoot, jwtExpiresSeconds, clientId, function(err, token) {
                if (err) {
                  return done(err);
                }
                var now = new Date();
                var exp = new Date(now.getTime() + jwtExpiresSeconds * 1000);
                /* eslint-disable camelcase */
                return done(null, token, null, {expires_at: exp});
                /* eslint-enable camelcase */
              });
            }
          });
        });
      });
    }));

    // Exchange the client id and password/secret for an access token.  The callback accepts the
    // `client`, which is exchanging the client's id and password/secret from the
    // authorization request for verification. If these values are validated, the
    // application issues an access token on behalf of the client who authorized the code.

    server.exchange(oauth2orize.exchange.clientCredentials(function(client, scope, done) {
      boundLogger.info('exchange client id and secret for access token', {
        client: client,
        scope: scope
      });
      //Validate the client
      query.findServiceAccount(db, {}, 'openid', client.clientId, function(err, localClient) {
        if (err) {
          return logging.logAndWrapError(boundLogger, err,
            'exchange.clientCredentials validateAuthorizationCode client', 'openid.bad', {
              client: client.clientId
            }, done);
        }
        if (localClient === null) {
          return done(null, false);
        }
        if (localClient.providerDetails.clientSecret !== client.clientSecret) {
          return done(null, false);
        }
        accessToken.generateAccessToken(jwtSecret, jwtIssuer, jwtAudienceRoot, jwtExpiresSeconds, client.clientId, function(err, token) {
          if (err) {
            console.log('de5s');
            console.log(err);
            return done(err);
          }
          var now = new Date();
          var exp = new Date(now.getTime() + jwtExpiresSeconds * 1000);
          /* eslint-disable camelcase */
          return done(null, token, null, {expires_at: exp});
          /* eslint-enable camelcase */
        });
      });
    }));
  });

  router.get('/authorize', [
    login.ensureLoggedIn('/$login/'),
    csrfProtection,
    server.authorization(function(clientId, redirectUri, done) {
      query.findServiceAccount(db, {}, 'openid', clientId, function(err, client) {
        if (err) {
          return logging.logAndWrapError(boundLogger, err,
            'server.authorization findServiceAccount', 'openid.bad', {
              clientId: clientId
            }, done);
        }
        // WARNING: For security purposes, it is highly advisable to check that
        //          redirectURI provided by the client matches one registered with
        //          the server.  For simplicity, this example does not.  You have
        //          been warned.
        return done(null, client, redirectUri);
      });
    }, function(client, user, done) {
      // Check if grant request qualifies for immediate approval
      if (ldb.userHasToken(user.user.path(), client.clientId)) {
        // Auto-approve
        return done(null, true);
      }
      if (ldb.clientIsTrusted(client.clientId)) {
        // Auto-approve
        return done(null, true);
      }
      // Otherwise ask user
      done(null, false);
    }),
    function(req, res) {
      res.cacheControl.noCache();
      var data = view.basicViewSetup(undefined, req, res);
      data.csrfToken = req.csrfToken();
      data.transactionID = req.oauth2.transactionID;
      data.client = req.oauth2.client;
      res.expose(data.intl, 'intl');
      req.scheme.render('decision', data,
        function(err, page) {
          if (err) {
            res.write("ERROR");
            res.end();
            boundLogger.error('passportPaths render error at start', {
              ctx: req.ctx,
              err: err
            });
            return;
          }
          res.writeHead(200, {'Content-Type': 'text/html'});
          page.on("data", function(data) {
            res.write(data);
          })
          .on("end", function() {
            res.end();
          })
          .on("error", function(err) {
            res.end();
          });
          logging.logEventEmitterErrors(boundLogger, page, req.ctx,
            'passportPaths render error');
        });
    }
  ]);

  // user decision endpoint
  //
  // `decision` middleware processes a user's decision to allow or deny access
  // requested by a client application.  Based on the grant type requested by the
  // client, the above grant middleware configured above will be invoked to send
  // a response.

  router.post('/authorize/decision', [
    login.ensureLoggedIn('/$login/'),
    server.decision()
  ]);

  // token endpoint
  //
  // `token` middleware handles client requests to exchange authorization grants
  // for access tokens.  Based on the grant type being exchanged, the above
  // exchange middleware will be invoked to handle the request.  Clients must
  // authenticate when making requests to this endpoint.

  router.post('/token', [
    passport.authenticate(['basic', 'oauth2-client-password'], {session: false}),
    server.token(),
    server.errorHandler()
  ]);

  router.use(function(req, res, next) {
    res.status(404).send('404: Page not Found');
  });
};

exports.router = router;
exports.db = ldb;
