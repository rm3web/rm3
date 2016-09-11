var express = require('express');
var pathMap = require('./middleware/path_map');
var fetchEntity = require('./middleware/fetch_entity');
var schemeMap = require('./middleware/scheme_map');
var pageMap = require('./middleware/page_map');
var siteMap = require('./middleware/site_map');
var errorHandle = require('./middleware/error_handle');
var contextCreate = require('./middleware/context_create');
var generateAccess = require('./middleware/generate_access');
var cacheControl = require('./middleware/cachecontrol');
var path = require('path');
var query = require('./query');
var Scheme = require('./scheme');
var entity = require('./entity');
var db = require('./db');
var bodyParser = require('body-parser');
var serveStatic = require('serve-static'),
    favicon = require('serve-favicon'),
    flash = require('./middleware/flash'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    RedisStore = require('connect-redis')(session),
    morgan = require('morgan'),
    nosniff = require('dont-sniff-mimetype'),
    frameguard = require('frameguard');
var localAuth = require('./authentication/local_auth'),
    twitterAuth = require('./authentication/twitter_auth'),
    jwtAuth = require('./authentication/jwt_auth'),
    totpAuth = require('./authentication/totp_auth'),
    authentication = require('./authentication');
var SitePath = require('sitepath');
var winston = require('winston'),
    expressWinston = require('express-winston');
var expstate = require('express-state');
var Conf = require('./conf'),
    jwtSecret = Conf.getCertificate('jwtSecret');
var phase = require('./phase');
var async = require('async');
var passport = require('passport'),
    AnonymousStrategy = require('passport-anonymous').Strategy;
var BlobStores = require('./blobstores'),
    FileBlobStore = require('./fileblobstore');
var workflow = require('./workflow'),
    runWorkflows = require('./runworkflows');
var redisModule = require('cache-service-redis');
var cs = require('cache-service');
var redisCache = new redisModule({redisUrl: Conf.getEndpoint('cacheRedis')}),
    cacheService = new cs({}, [redisCache]),
    Redis = require("redis"),
    sessionRedisClient = Redis.createClient(Conf.getEndpoint('sessionRedis')),
    RateLimiter = require("rolling-rate-limiter");

phase.addDefaultPhase('logging', function(app, next) {
  winston.remove(winston.transports.Console);
  winston.add(winston.transports.Console, {colorize: true});

  app.use(expressWinston.logger({
    winstonInstance: winston,
    meta: true, // optional: control whether you want to log the meta data about the request (default to true)
    msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
    expressFormat: false,
    colorStatus: false
  }));

  next();
});

phase.addDefaultPhase('passport-setup', function(app, next) {
  winston.info('front', 'passport-setup startup');
  var forceAuth;
  if (process.env.RM3_DANGER_FORCE_AUTH) {
    forceAuth = process.env.RM3_DANGER_FORCE_AUTH;
    winston.warn('Warning: rm3 is set to force auth to a single user.');
    winston.info('If you run this on the public internet, you will get hacked.');
  }

  if (!forceAuth) {
    authentication.passportConnect(db, query, entity.Entity, new SitePath(['wh', 'users']));
  }
  next();
});

phase.addDefaultPhase('blob-setup', function(app, next) {
  var conf = {
    path: Conf.getPath('localBlobs'),
    urlroot: '/blobs/',
    category: 'public'
  };
  BlobStores.register('public', new FileBlobStore(conf, db));
  var blobStaticConf = {
    maxAge: '1d'
  };
  if (Conf.getConfig('cacheControlDisable')) {
    blobStaticConf = {};
  }
  app.use('/blobs/', serveStatic(Conf.getPath('localBlobs'), blobStaticConf));
  app.use(function(req, res, cb) {
    req.blobstores = BlobStores;
    cb();
  });
  next();
});

phase.addDefaultPhase('workflow-setup', function(app, next) {
  workflow.loadConf(function() {
    runWorkflows(next);
  });
});

phase.addDefaultPhase('session', function(app, next) {
  winston.info('front', 'session startup');
  if (Conf.getCertificate('sessionFlag')) {
    winston.warn('You haven\'t set a RM3_SESSION_SECRET variable so we generated a random string.');
    winston.info('See docs/env.md for more information');
  }
  app.use(session({
    store: new RedisStore({
      url: Conf.getEndpoint('sessionRedis')
    }),
    secret: Conf.getCertificate('sessionSecret'),
    resave: false,
    saveUninitialized: false,
    httpOnly: true
  }));
  next();
});

phase.addDefaultPhase('static-resources', function(app, next) {
  winston.info('front', 'static-resources startup');
  var staticResourceConf = {
    maxAge: '1d'
  };
  if (Conf.getConfig('cacheControlDisable')) {
    staticResourceConf = {};
  }
  app.use('/resources/', serveStatic(Conf.getPath('resources'), staticResourceConf));
  app.use(favicon(Conf.getPath('resources') + '/favicon.ico'));
  next();
});

phase.addDefaultPhase('passport-middleware', function(app, next) {
  winston.info('front', 'passport-middleware startup');
  var forceAuth;
  if (process.env.RM3_DANGER_FORCE_AUTH) {
    forceAuth = process.env.RM3_DANGER_FORCE_AUTH;
  }
  if (forceAuth) {
    var forceAuthMiddleware = require('./middleware/force_auth');
    app.use(forceAuthMiddleware(new SitePath(['wh', 'users']), 'wirehead', db, query, entity.Entity));
  }
  passport.use(new AnonymousStrategy());
  if (!forceAuth) {
    localAuth.passport(app);
  }
  next();
});

phase.addDefaultPhase('error-handling', function(app, next) {
  winston.info('front', 'error-handling startup');
  app.use(expressWinston.errorLogger({
    winstonInstance: winston
  }));

  app.use(errorHandle.handle403);
  app.use(errorHandle.handle404);
  app.use(errorHandle.handle410);
  app.use(errorHandle.handle429);
  app.use(errorHandle.errorFallThrough);
  next();
});

phase.addDefaultPhase('passport-paths', function(app, next) {
  winston.info('front', 'passport-paths startup');
  var forceAuth;
  if (process.env.RM3_DANGER_FORCE_AUTH) {
    forceAuth = process.env.RM3_DANGER_FORCE_AUTH;
  }

  if (!forceAuth) {
    app.use('/\\$login', authentication.router);

    app.get('/\\$logout/', function(req, res) {
      res.cacheControl.noCache();
      req.logout();
      res.redirect('/');
    });
  }
  next();
});

var front = function(next) {
  var app = express();

  app.disable('x-powered-by');
  app.use(frameguard());
  app.use(nosniff());

  app.use(cacheControl());
  expstate.extend(app);
  async.series([
    function(next) {
      app.use(function(req, res, next) {
        req.db = db;
        req.cache = cacheService;
        next();
      });
      next();
    },
    phase.runPhase.bind(this,'logging',app),
    function(next) {
      if (Conf.getConfig('trustProxy')) {
        winston.info('front', 'trusting proxy:', Conf.getConfig('trustProxy'));
      }
      app.set('trust proxy', Conf.getConfig('trustProxy'));

      if (Conf.getConfig('disableHttpsChecks')) {
        winston.warn('Warning: rm3 is set to not check for https at login');
        winston.info('If you do this on the public internet, you will get hacked.');
      }
      next();
    },
    phase.runPhase.bind(this,'passport-setup',app),
    phase.runPhase.bind(this,'blob-setup',app),
    phase.runPhase.bind(this,'static-resources',app),
    phase.runPhase.bind(this,'workflow-setup',app),
    function(next) {
      app.use(function(req, res, next) {
        req.rateLimiter = {};
        req.rateLimiter.userLogin = RateLimiter({
          redis: sessionRedisClient,
          namespace: "UserLoginLimiter",
          interval: 100000,
          maxInInterval: 10,
          minDifference: 100
        });
        req.rateLimiter.csrfLimiter = RateLimiter({
          redis: sessionRedisClient,
          namespace: "CommentCsrfLimiter",
          interval: 10000,
          maxInInterval: 10,
          minDifference: 100
        });
        req.rateLimiter.csrfEmailLimiter = RateLimiter({
          redis: sessionRedisClient,
          namespace: "EmailCsrfLimiter",
          interval: 100000,
          maxInInterval: 3,
          minDifference: 1000
        });
        req.rateLimiter.emailLimiter = RateLimiter({
          redis: sessionRedisClient,
          namespace: "EmailLimiter",
          interval: 100000,
          maxInInterval: 3,
          minDifference: 1000
        });
        req.rateLimiter.ipLimiter = RateLimiter({
          redis: sessionRedisClient,
          namespace: "CommentIpLimiter",
          interval: 100000,
          maxInInterval: 10,
          minDifference: 100
        });

        req.rateLimiter.userLimiter = RateLimiter({
          redis: sessionRedisClient,
          namespace: "CommentUserLimiter",
          interval: 100000,
          maxInInterval: 10,
          minDifference: 100
        });
        next();
      });
      next();
    },
    function(next) {
      app.use(cookieParser());
      next();
    },
    phase.runPhase.bind(this,'session',app),
    function(next) {
      app.use(flash());
      next();
    },
    phase.runPhase.bind(this,'passport-middleware',app),
    function(next) {
      var forceAuth;
      if (process.env.RM3_DANGER_FORCE_AUTH) {
        forceAuth = process.env.RM3_DANGER_FORCE_AUTH;
      }
      if (!forceAuth) {
        if (jwtSecret) {
          app.use(passport.authenticate(['jwt', 'anonymous'], {session: false}));
        }
      }
      app.use(contextCreate());
      app.use(generateAccess());

      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({extended: true}));

      app.use(schemeMap(Scheme, db, cacheService, query));
      app.use(siteMap(db, query));
      next();
    },
    phase.runPhase.bind(this,'passport-paths',app),
    function(next) {
      app.use(pathMap());
      app.use(fetchEntity(db, cacheService, query, entity.Entity, entity.StubEntity));
      app.use(pageMap());

      app.use(function(req, res, next) {
        req.db = db;
        req.cache = cacheService;
        req.page.render(req, res, next);
      });
      next();
    },
    phase.runPhase.bind(this,'error-handling',app)
  ], function(err) {
    if (err) {
      return next(err);
    }
    winston.info('front', 'startup complete');
    app.listen(Conf.getConfig('listenPort'), Conf.getConfig('listenHostname'));
    next();
  });
};

module.exports = exports = front;
