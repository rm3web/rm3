var passport = require('passport'),
    TotpStrategy = require('passport-totp').Strategy,
    validator = require('validator'),
    user = require('./user'),
    util = require('util'),
    errs = require('errs'),
    logging = require('../logging'),
    i10n = require('../i10n'),
    csurf = require('csurf'),
    base32 = require('thirty-two'),
    crypto = require('crypto'),
    yaqrcode = require('yaqrcode'),
    update = require ('../update'),
    query = require('../query'),
    notp = require('notp');
var Conf = require('../conf'),
    totpIssuer = Conf.getCertificate('totpIssuer');

var csrfProtection = csurf();
var boundLogger = logging.getRootLogger('totp_auth');

exports.passportConnect = function passportConnect(db, query, entity, userpath) {
  passport.use(new TotpStrategy(
    function(user, done) {
      var userId = user.user.data.email;
      if (!userId) {
        userId = user.user.path().leaf();
      }
      query.findCredential(db, {}, 'totp', userId, function(err, credential) {
        if (err) {
          return done(err);
        }
        return done(null, base32.decode(credential.providerDetails.secret));
      });
    }
  ));
};

/**
Initializes the passport paths for login and logout.  Needs to be called towards
the bottom of the express stack, but before you try to map site paths.
@param {Object} app Express app object
*/
exports.passportPaths = function(app) {

  app.get('/totp', csrfProtection, function(req, res, next) {
    if (!req.user) {
      res.redirect('/$login');
    }
    var userId = req.user.user.data.email;
    if (!userId) {
      userId = req.user.user.path();
    }
    query.findCredential(req.db, {}, 'totp', userId, function(err, credential) {
      if (err) {
        return next(err);
      }
      if (!credential) {
        return res.redirect('/$login');
      }
      res.cacheControl.noCache();
      var view = {meta: {modified: null, created:null}, user: req.user};
      view.errorMessage = req.getFlashMsgs('error');
      view.infoMessage = req.getFlashMsgs('info');
      view.intl = i10n.getIntl();
      view.site = req.site;
      view.scheme = req.scheme;
      view.security = req.access;
      view.csrfToken = req.csrfToken();
      res.expose(view.intl, 'intl');
      view.expose = res.locals.state.toString();
      req.scheme.render('totp', view,
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
  });

  app.post('/totp',
  passport.authenticate('totp', {failureRedirect: '/$login/totp', failureFlash: true}),
  function(req, res) {
    req.session.secondFactor = 'totp';
    res.redirect('/');
  });

  app.get('/totp/enroll', csrfProtection, function(req, res) {
    // Generate the TOTP secret
    var secret = base32.encode(crypto.randomBytes(16));
    var userstr = req.user.user.path().leaf();
    var qrData = 'otpauth://totp/' + totpIssuer + ":" + userstr + '?secret=' +
      secret.toString().replace(/=/g, '') + '&issuer=' + totpIssuer;

    res.cacheControl.noCache();
    var view = {meta: {modified: null, created:null}, user: req.user};
    view.errorMessage = req.getFlashMsgs('error');
    view.infoMessage = req.getFlashMsgs('info');
    view.intl = i10n.getIntl();
    view.site = req.site;
    view.scheme = req.scheme;
    view.security = req.access;
    view.csrfToken = req.csrfToken();
    view.qrUrl = yaqrcode(qrData, {
      size: 332
    });
    view.account = userstr;
    view.secret = secret;
    view.secretDecode = secret.toString().replace(/=/g, '');
    res.expose(view.intl, 'intl');
    view.expose = res.locals.state.toString();
    req.scheme.render('totp-setup', view,
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

  app.post('/totp/enroll', csrfProtection, function(req, res, next) {
    user.authenticatePassword(req.db, req.ctx, query, req.user.user.data.email, req.body.password, function(err) {
      if (err) {
        if (err.name === 'PasswordValidationError') { // bad password
          req.flash('error', i10n.formatMessage('PASSWORD_VALIDATION_FAILED', {}));
          return res.redirect('/$login/totp/enroll');
        } else {
          return next(err);
        }
      }
      if (!user) { // We didn't get a user
        req.flash('error', i10n.formatMessage('PASSWORD_VALIDATION_FAILED', {}));
        return res.redirect('/$login/totp/enroll');
      }
      var secret = req.body.secret;
      if (notp.totp.verify(req.body.token, base32.decode(secret))) {
        update.createCredential(req.db, req.ctx, 'totp', req.user.user.data.email, req.user.user.path().toDottedPath(), {secret: req.body.secret}, function(err) {
          if (err) {
            console.log(err);
            return res.redirect('/$login/totp/enroll');
          }
          req.flash('info', i10n.formatMessage('TOTP_ADDED', {}));
          return res.redirect('/');
        });
      } else {
        req.flash('error', i10n.formatMessage('TOTP_ENROLL_FAILED', {}));
        return res.redirect('/$login/totp/enroll');
      }
    });
  });
};
