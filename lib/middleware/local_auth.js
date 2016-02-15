var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    validator = require('validator'),
    user = require('../user'),
    util = require('util'),
    errs = require('errs'),
    logging = require('../logging'),
    i10n = require('../i10n'),
    csurf = require('csurf');

var csrfProtection = csurf();
var boundLogger = logging.getRootLogger('local_auth');

function BadStoredUserId() {
  this.httpResponseCode = 403;
  this.message = "BAD_ID_IN_COOKIE";
}
i10n.intlErrorMixin(BadStoredUserId);
util.inherits(BadStoredUserId, Error);
errs.register('local_auth.bad_id', BadStoredUserId);

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
  //  To support persistent login sessions, Passport needs to be able to
  //  serialize users into and deserialize users out of the session.  Typically,
  //  this will be as simple as storing the user ID when serializing, and finding
  //  the user by ID when deserializing.
  passport.serializeUser(function(user, done) {
    var userstr = user.user.path().leaf() + ':' + user.user._entityId;
    boundLogger.info('serializeUser', {
      userstr: userstr
    });
    done(null, userstr);
  });

  passport.deserializeUser(function(id, done) {
    boundLogger.info('deserializeUser', {
      id: id
    });
    var userids = id.split(':', 2);
    user.findByUsername(db, {}, query, entity, userpath, userids[0], function(err, user) {
      if (err) {
        return logging.logAndCreateError(boundLogger,
          'failure to look up user',
          'local_auth.bad_id', {
            underlying: err,
            id: id
          }, done);
      }
      if (user._entityId === userids[1]) {
        done(err, {user: user});
      } else {
        return logging.logAndCreateError(boundLogger,
          'deserializeUser entityId and cookie don\'t match',
          'local_auth.bad_id', {
            entityId: user._entityId,
            id: id
          }, done);
      }
    });
  });

  // Use the LocalStrategy within Passport.
  //   Strategies in passport require a `verify` function, which accept
  //   credentials (in this case, a username and password), and invoke a callback
  //   with a user object.  In the real world, this would query a database;
  //   however, in this example we are using a baked-in set of users.
  passport.use(new LocalStrategy(
    function(username, password, done) {
      // Find the user by username.  If there is no user with the given
      // username, or the password is not correct, set the user to `false` to
      // indicate failure and set a flash message.  Otherwise, return the
      // authenticated `user`.
      user.findByUsername(db, {}, query, entity, userpath, username, function(err, userRec) {
        if (err) { return done(err); }
        user.authenticatePassword(password, userRec, function(err) {
          if (err) {
            return done(err);
          } else {
            return done(null, {user: userRec});
          }
        });
      });
    }
  ));
};

/**
Initializes passport and the passport.session() middlware for persistent
login sessions.  Should be called towards the top of the express stack
@param {Object} app Express app object
*/
exports.passport = function(app) {
  app.use(passport.initialize());
  app.use(passport.session());
};

/**
Initializes the passport paths for login and logout.  Needs to be called towards
the bottom of the express stack, but before you try to map site paths.
@param {Object} app Express app object
*/
exports.passportPaths = function(app) {
  app.get('/\\$login/', csrfProtection, function(req, res) {
    res.set('Cache-Control', 'no-cache');
    var view = {meta: {modified: null, created:null}, user: req.user};
    view.errorMessage = req.flash('error');
    view.infoMessage = req.flash('info');
    view.intl = i10n.getIntl();
    view.site = req.site;
    view.scheme = req.scheme;
    view.security = req.access;
    view.csrfToken = req.csrfToken();
    res.expose(view.intl, 'intl');
    view.expose = res.locals.state.toString();
    req.scheme.render('login', view,
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
  });

  app.post('/\\$login/', csrfProtection, function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
      if (err) {
        if (err.name === 'PasswordValidationError') { // bad password
          req.flash('error', i10n.formatMessage('PASSWORD_VALIDATION_FAILED', {}));
          return res.redirect('/$login/');
        } else {
          return next(err);
        }
      }
      if (!user) { // We didn't get a user
        req.flash('error', i10n.formatMessage('PASSWORD_VALIDATION_FAILED', {}));
        return res.redirect('/$login/');
      }
      if (user.data.disableLogin) {
        req.flash('error', i10n.formatMessage('PASSWORD_VALIDATION_FAILED', {}));
        return res.redirect('/$login/');
      }
      req.logIn(user, function(err) {
        if (err) {
          req.flash('error', err.message);
          return res.redirect('/$login/');
        }
        req.flash('info', i10n.formatMessage('YOU_HAVE_BEEN_LOGGED_IN', {}));
        return res.redirect('/');
      });
    })(req, res, next);
  });

  app.get('/\\$logout/', function(req, res) {
    req.logout();
    res.redirect('/');
  });
};
