var passport = require('passport'),
    TotpStrategy = require('passport-totp').Strategy,
    validator = require('validator'),
    user = require('../user'),
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

/**
Initializes the passport paths for login and logout.  Needs to be called towards
the bottom of the express stack, but before you try to map site paths.
@param {Object} app Express app object
*/
exports.passportPaths = function(db, app) {
  app.get('/\\$login/totp/enroll', csrfProtection, function(req, res) {
    // Generate the TOTP secret
    var secret = base32.encode(crypto.randomBytes(16));

    var userstr = req.user.user.path().leaf();
    var qrData = 'otpauth://totp/' + totpIssuer + ":" + userstr + '?secret=' + secret.toString().replace(/=/g, '');

    res.set('Cache-Control', 'no-cache');
    var view = {meta: {modified: null, created:null}, user: req.user};
    view.errorMessage = req.flash('error');
    view.infoMessage = req.flash('info');
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

  app.post('/\\$login/totp/enroll', csrfProtection, function(req, res, next) {
    user.authenticatePassword(db, req.ctx, query, req.user.user.data.email,
                              req.body.password, function(err) {
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
        update.createCredential(db, req.ctx, 'totp', req.user.user.data.email,
                                req.user.user.path().toDottedPath(),
                                {secret: req.body.secret}, function(err) {
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
