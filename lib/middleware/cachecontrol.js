exports = module.exports = function() {
  return function addContext(req, res, next) {
    res.cacheControl = {};
    res.cacheControl.userCacheable = function() {
      res.set('Cache-Control', 'private');
      res.vary('Cookie');
    };

    res.cacheControl.noCache = function() {
      res.set('Cache-Control', 'no-cache');
    };

    res.smartEtag = function(pageRevisionId, contentRevisionId) {
      res.setHeader('ETag', pageRevisionId + ':' + contentRevisionId);
    };

    next();
  };
};
