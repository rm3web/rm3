var express = require('express'),
    csurf = require('csurf'),
    view = require('../view'),
    logging = require('../logging'),
    requireHttps = require('require-https'),
    localAuth = require('./local_auth'),
    twitterAuth = require('./twitter_auth'),
    basicAuth = require('./basic_auth'),
    jwtAuth = require('./jwt_auth'),
    totpAuth = require('./totp_auth'),
    bearerAuth = require('./bearer_auth'),
    SitePath = require('sitepath'),
    Conf = require('../conf');

var csrfProtection = csurf();
var router = express.Router();
var boundLogger = logging.getRootLogger('authentication');

function passportConnect(db, query, entity, path) {
  query.getSiteConfig(db, {}, 'default', 'sitepath', function(err, config) {
    var path = new SitePath(['wh', 'users']);
    if (!err) {
      path = new SitePath(config.root).down('users');
    }
    localAuth.passportConnect(db, query, entity, path);
    twitterAuth.passportConnect(db, query, entity, path);
    jwtAuth.passportConnect(db, query, entity, path);
    totpAuth.passportConnect(db, query, entity, path);
    basicAuth.passportConnect(db, query, entity, path);
    bearerAuth.passportConnect(db, query, entity, path);
  });
}

if (!Conf.getConfig('disableHttpsChecks')) {
  router.get('/', requireHttps(403, 'HTTPS is required to log in.'));
}

router.get('/', csrfProtection, function(req, res) {
  res.cacheControl.noCache();
  var data = view.basicViewSetup(undefined, req, res);
  data.csrfToken = req.csrfToken();
  res.expose(data.intl, 'intl');
  req.scheme.render('login', data,
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

localAuth.passportPaths(router);
twitterAuth.passportPaths(router);
totpAuth.passportPaths(router);

router.use(function(req, res, next) {
  res.status(404).send('404: Page not Found');
});

exports.router = router;
exports.passportConnect = passportConnect;
