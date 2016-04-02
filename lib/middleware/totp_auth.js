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
    yaqrcode = require('yaqrcode');

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
    secret = secret.toString().replace(/=/g, ''); // Google Auth doesn't like ='s.

    var userstr = req.user.user.path().leaf() + ':' + req.user.user._entityId;
    var qrData = 'otpauth://totp/' + userstr + '?secret=' + secret;

    res.set('Cache-Control', 'no-cache');
    var view = {meta: {modified: null, created:null}, user: req.user};
    view.errorMessage = req.flash('error');
    view.infoMessage = req.flash('info');
    view.intl = i10n.getIntl();
    view.site = req.site;
    view.scheme = req.scheme;
    view.security = req.access;
    view.csrfToken = req.csrfToken();
    view.qrUrl = yaqrcode(qrData);
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
};
