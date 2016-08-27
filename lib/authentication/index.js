var express = require('express'),
    csurf = require('csurf'),
    view = require('../view'),
    logging = require('../logging'),
    requireHttps = require('require-https'),
    Conf = require('../conf');

var csrfProtection = csurf();
var router = express.Router();
var boundLogger = logging.getRootLogger('authentication');

if (!Conf.getConfig('disableHttpsChecks')) {
  router.get('/\\$login/', requireHttps(403, 'HTTPS is required to log in.'));
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

module.exports = router;
