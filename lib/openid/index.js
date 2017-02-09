var passport = require('passport'),
    oauth2orize = require('oauth2orize'),
    user = require('../authentication/user'),
    util = require('util'),
    errs = require('errs'),
    view = require('../view'),
    login = require('connect-ensure-login'),
    logging = require('../logging'),
    SitePath = require('sitepath'),
    Conf = require('../conf'),
    accessToken = require('./accesstoken'),
    authorizationCode = require('./authorizationcode');

var jwtSecret = Conf.getCertificate('jwtSecret');
var jwtIssuer = Conf.getCertificate('jwtIssuer');
var server;
var boundLogger = logging.getRootLogger('openid');

var clients = [
  {id: '1', name: 'Samplr', clientId: 'abc123', clientSecret: 'ssh-secret'},
  {id: '2', name: 'Samplr2', clientId: 'xyz123', clientSecret: 'ssh-password'}
];

var ldb = {};
ldb.clients = {};
ldb.clients.find = function(id, done) {
  boundLogger.info('client find', {
  });
  for (var i = 0, len = clients.length; i < len; i++) {
    var client = clients[i];
    if (client.id === id) {
      return done(null, client);
    }
  }
  return done(null, null);
};

ldb.clients.findByClientId = function(clientId, done) {
  boundLogger.info('client findByClientId', {
  });
  for (var i = 0, len = clients.length; i < len; i++) {
    var client = clients[i];
    if (client.clientId === clientId) {
      return done(null, client);
    }
  }
  return done(null, null);
};

exports.openidConnect = function openidConnect(db, query, entity) {
  if (!jwtSecret) {
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
      return done(null, client.id);
    });

    server.deserializeClient(function(id, done) {
      boundLogger.info('deserializeClient', {
        id: id
      });
      ldb.clients.find(id, function(err, client) {
        if (err) {
          return done(err);
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
    server.grant(oauth2orize.grant.code(function(client, redirectURI, user, ares, done) {
      boundLogger.info('grant authorization code', {
        client: client,
        redirectURI: redirectURI,
        user: user,
        ares: ares
      });

      authorizationCode.generateAuthorizationCode(jwtSecret, jwtIssuer, client.id, user.id, redirectURI, function(err, code) {
        if (err) {
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
      accessToken.generateAccessToken(jwtSecret, jwtIssuer, clientId, function(err, token) {
        if (err) {
          return done(err);
        }
        return done(null, token);
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
      ldb.clients.findByClientId(client.clientId, function(err, localClient) {
        if (err) {
          return done(err);
        }
        if (localClient === null) {
          return done(null, false);
        }
        if (localClient.clientSecret !== client.clientSecret) {
          return done(null, false);
        }
        //Validate the user
        user.findByUsername(db, {}, query, entity, userpath, username, function(err, userRec) {
          if (err) {
            return done(err);
          }
          user.authenticatePassword(db, {}, query, userRec.data.email, password, function(err) {
            if (err) {
              return done(err);
            } else {
              var clientId = client.clientId + '/' + userRec.path().leaf() + ':' + userRec._entityId;
              accessToken.generateAccessToken(jwtSecret, jwtIssuer, clientId, function(err, token) {
                if (err) {
                  return done(err);
                }
                return done(null, token);
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
      ldb.clients.findByClientId(client.clientId, function(err, localClient) {
        if (err) {
          return done(err);
        }
        if (localClient === null) {
          return done(null, false);
        }
        if (localClient.clientSecret !== client.clientSecret) {
          return done(null, false);
        }
        accessToken.generateAccessToken(jwtSecret, jwtIssuer, client.clientId, function(err, token) {
          if (err) {
            return done(err);
          }
          return done(null, token);
        });
      });
    }));
  });
};

exports.openidPaths = function(app) {
  if (!jwtSecret) {
    return;
  }
  app.get('/dialog/authorize', [
    login.ensureLoggedIn(),
    server.authorization(function(clientID, redirectURI, done) {
      ldb.clients.findByClientId(clientID, function(err, client) {
        if (err) {
          return done(err);
        }
        // WARNING: For security purposes, it is highly advisable to check that
        //          redirectURI provided by the client matches one registered with
        //          the server.  For simplicity, this example does not.  You have
        //          been warned.
        return done(null, client, redirectURI);
      });
    }, function(client, user, done) {
      // Check if grant request qualifies for immediate approval
      if (user.has_token(client)) {
        // Auto-approve
        return done(null, true);
      }
      if (client.isTrusted()) {
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

  app.post('/dialog/authorize/decision', [
    login.ensureLoggedIn(),
    server.decision()
  ]);

  // token endpoint
  //
  // `token` middleware handles client requests to exchange authorization grants
  // for access tokens.  Based on the grant type being exchanged, the above
  // exchange middleware will be invoked to handle the request.  Clients must
  // authenticate when making requests to this endpoint.

  app.post('/oauth/token', [
    passport.authenticate(['basic', 'oauth2-client-password'], {session: false}),
    server.token(),
    server.errorHandler()
  ]);
};

exports.db = ldb;
