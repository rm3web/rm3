/**
* @overview Error handling middleware
* @title Error Handling
* @module error_handle
*/

var logging = require('../logging');

var boundLogger = logging.getRootLogger('middleware.error_handle');

exports.handle403 = function handle403(err, req, res, next) { // 403: Forbidden
  var code = 500, header = 'Internal Error';
  if (err.hasOwnProperty('httpResponseCode')) {
    code = err.httpResponseCode;
  }
  if (code === 403) {
    res.cacheControl.noCache();
    res.status(code);
    var context = {};
    context.scheme = req.scheme;
    context.errortitle = header;
    context.errordata = JSON.stringify(err);
    if (req.hasOwnProperty('scheme') && req.scheme.renderSync instanceof Function) {
      req.scheme.renderSync('403', context, function(err, data) {
        if (err) {
          next(err);
        } else {
          res.write(data);
          res.end();
        }
      });
    } else {
      next(err);
    }
  } else {
    next(err);
  }
};

exports.handle404 = function handle404(err, req, res, next) { // 404: Not found
  var code = 500, header = 'Internal Error';
  if (err.hasOwnProperty('httpResponseCode')) {
    code = err.httpResponseCode;
  }
  if (code === 404) {
    res.cacheControl.noCache();
    res.status(code);
    var context = {};
    context.scheme = req.scheme;
    context.errortitle = header;
    context.errordata = JSON.stringify(err);
    if (req.hasOwnProperty('scheme') && req.scheme.renderSync instanceof Function) {
      req.scheme.renderSync('404', context, function(err, data) {
        if (err) {
          next(err);
        } else {
          res.write(data);
          res.end();
        }
      });
    } else {
      next(err);
    }
  } else {
    next(err);
  }
};

exports.handle410 = function handle404(err, req, res, next) { // 404: Not found
  var code = 500, header = 'Internal Error';
  if (err.hasOwnProperty('httpResponseCode')) {
    code = err.httpResponseCode;
  }
  if (code === 410) {
    res.cacheControl.noCache();
    res.status(code);
    var context = {};
    context.scheme = req.scheme;
    context.errortitle = header;
    context.errordata = JSON.stringify(err);
    if (req.hasOwnProperty('scheme') && req.scheme.renderSync instanceof Function) {
      req.scheme.renderSync('410', context, function(err, data) {
        if (err) {
          next(err);
        } else {
          res.write(data);
          res.end();
        }
      });
    } else {
      next(err);
    }
  } else {
    next(err);
  }
};

exports.handle429 = function handle429(err, req, res, next) { // 429: Too Many Requests
  var code = 500, header = 'Internal Error';
  if (err.hasOwnProperty('httpResponseCode')) {
    code = err.httpResponseCode;
  }
  if (code === 429) {
    res.cacheControl.noCache();
    res.status(code);
    res.set('Retry-After', err.timeLeft);
    var context = {};
    context.scheme = req.scheme;
    context.errortitle = header;
    context.timeLeft = err.timeLeft;
    context.errordata = JSON.stringify(err);
    if (req.hasOwnProperty('scheme') && req.scheme.renderSync instanceof Function) {
      req.scheme.renderSync('429', context, function(err, data) {
        if (err) {
          next(err);
        } else {
          res.write(data);
          res.end();
        }
      });
    } else {
      next(err);
    }
  } else {
    next(err);
  }
};

/**
 Currently tries to process just about all errors.  Will try to render something
 using the scheme's error template.  If that fails, reverts to an ugly templateless
 view.
*/

exports.errorFallThrough = function errorFallthrough(err, req, res, next) {
  if (err) {
    var code = 500, header = 'Internal Error';
    if (err.hasOwnProperty('httpResponseCode')) {
      code = err.httpResponseCode;
    }

    if (err.getMessage instanceof Function) {
      header = err.getMessage();
    } else if (err.hasOwnProperty('message')) {
      header = err.message;
    }
    res.writeHead(code, header, {});
    if (req.method !== 'HEAD') {
      var context = {};
      context.scheme = req.scheme;
      context.errortitle = header;
      if (process.env.NODE_ENV !== 'production') {
        context.errordata = JSON.stringify(err);
      } else {
        context.errordata = '';
      }
      if (req.hasOwnProperty('scheme') && req.scheme.renderSync instanceof Function) {
        req.scheme.renderSync('error', context, function(err, data) {
          if (err) {
            boundLogger.error('cannot render exception: req.scheme.renderSync failed');
            var body;
            if (process.env.NODE_ENV !== 'production') {
              body = JSON.stringify(err);
            }
            res.write('<code>' + body + '</code>\n');
          } else {
            res.write(data);
          }
        });
      } else {
        boundLogger.error('cannot render exception: req.scheme.renderSync not present');
        var body;
        if (process.env.NODE_ENV !== 'production') {
          body = JSON.stringify(err);
        }
        res.write('<code>' + body + '</code>\n');
      }
    }
    res.end();
  }
};
