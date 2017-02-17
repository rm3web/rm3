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
var Protoset = require('./protoset');
var serveStatic = require('serve-static'),
    favicon = require('serve-favicon'),
    flash = require('./middleware/flash'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    RedisStore = require('connect-redis')(session),
    morgan = require('morgan'),
    nosniff = require('dont-sniff-mimetype'),
    frameguard = require('frameguard'),
    openid = require('./openid');
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
    rateMiddleware = require('./middleware/ratemiddleware');

phase.addDefaultPhase('before-everything', function(app, next) {
  next();
});

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
  authentication.passportConnect(app.locals.db, query, entity.Entity);
  openid.openidConnect(app.locals.db, query, entity.Entity);
  next();
});

phase.addDefaultPhase('blob-setup', function(app, next) {
  var conf = {
    path: Conf.getPath('localBlobs'),
    urlroot: '/blobs/',
    category: 'public'
  };
  BlobStores.register('public', new FileBlobStore(conf, app.locals.db, app.locals.cache));
  var blobStaticConf = {
    maxAge: '1d'
  };
  if (Conf.getConfig('cacheControlDisable')) {
    blobStaticConf = {};
  }
  if (Conf.getPath('privateBlobs')) {
    var privateConf = {
      path: Conf.getPath('privateBlobs'),
      urlroot: '/blobs/',
      category: 'private'
    };
    winston.info('front', 'private blob store active');
    BlobStores.register('private', new FileBlobStore(privateConf, app.locals.db, app.locals.cache));
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
    if (!Conf.getConfig('workflowDisable')) {
      runWorkflows(next);
    } else {
      next();
    }
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
  passport.use(new AnonymousStrategy());
  localAuth.passport(app);
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
  next();
});

phase.addDefaultPhase('error-default', function(app, next) {
  app.use(errorHandle.errorFallThrough);
  next();
});

phase.addDefaultPhase('scheme', function(app, next) {
  var scheme = new Scheme([path.join(__dirname, '../scheme/default/')], app.locals.db, app.locals.cache, query);
  app.use(schemeMap(scheme));
  next();
});

phase.addDefaultPhase('passport-paths', function(app, next) {
  winston.info('front', 'passport-paths startup');
  app.use('/\\$login', authentication.router);

  app.get('/\\$logout/', function(req, res) {
    res.cacheControl.noCache();
    req.logout();
    res.redirect('/');
  });

  app.use('/\\$oauth', openid.router);

  next();
});

var front = function(next) {
  var app = express();

  async.series([
    phase.runPhase.bind(this,'before-everything',app),
    function(next) {
      app.disable('x-powered-by');
      app.use(frameguard());
      app.use(nosniff());

      app.use(cacheControl());
      expstate.extend(app);

      app.locals.db = db;
      app.locals.cache = cacheService;
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
      app.use(rateMiddleware());
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
      if (jwtSecret) {
        app.use(passport.authenticate(['bearer', 'jwt', 'anonymous'], {session: false}));
      }
      app.use(contextCreate());
      app.use(generateAccess());

      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({extended: true}));
      next();
    },
    phase.runPhase.bind(this,'scheme',app),
    function(next) {
      app.use(siteMap(db, query));
      next();
    },
    phase.runPhase.bind(this,'passport-paths',app),
    function(next) {
      app.use(pathMap());
      app.use(fetchEntity(db, app.locals.cache, query, entity.Entity, entity.StubEntity));
      app.use(pageMap(Protoset));

      app.use(function(req, res, next) {
        req.page.render(req, res, next);
      });
      next();
    },
    phase.runPhase.bind(this,'error-handling',app),
    phase.runPhase.bind(this,'error-default',app)
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
