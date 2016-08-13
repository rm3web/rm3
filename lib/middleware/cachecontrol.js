var crypto = require('crypto');

exports = module.exports = function() {
  return function addContext(req, res, next) {
    res.cacheControl = {};
    res.cacheControl.userCacheable = function() {
      if (req.session && req.session.flash && Object.keys(req.session.flash).length !== 0) {
        res.set('Cache-Control', 'no-cache');
      } else {
        res.set('Cache-Control', 'private, must-revalidate, max-age=2592000');
      }
      res.vary('Cookie');
    };

    res.cacheControl.noCache = function() {
      res.set('Cache-Control', 'no-cache');
    };

    res.smartEtag = function(modified, pageRevisionId, contentRevisionId) {
      var tag = pageRevisionId + ':' + contentRevisionId;
      if (req.session) {
        if (req.session.passport) {
          tag = tag + ':' + req.session.passport.user;
        }
        if (req.session.flash && Object.keys(req.session.flash).length !== 0) {
          var hash = crypto
            .createHash('md5')
            .update(JSON.stringify(req.session.flash), 'utf8')
            .digest('base64');
          tag = tag + ':' + hash;
        }
      }
      res.header('Last-Modified', modified);
      res.setHeader('ETag', tag);
    };

    next();
  };
};
