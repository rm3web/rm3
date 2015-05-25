/**
* @overview Error handling middleware
* @title Error Handling
* @module error_handle
*/

/**
 Currently tries to process just about all errors.  Will try to render something
 using the scheme's error template.  If that fails, reverts to an ugly templateless
 view.
 @returns {Function} Connect/Express styled middleware that takes (err, req, res, next)
*/

function handleError() {
  return function doHandleError(err, req, res, next) {
    if (err) {
      var code = 500, header = 'Internal Error';
      if (err.hasOwnProperty('httpResponseCode')) {
        code = err.httpResponseCode;
      }
      if (err.getMessage instanceof Function) {
        header = err.getMessage();
      }
      else if (err.hasOwnProperty('message')) {
        header = err.message;
      }
      res.writeHead(code, header, {});
      if (req.method !== 'HEAD') {
        var context = {};
        context.errortitle = header;
        context.errordata = JSON.stringify(err);
        if (req.hasOwnProperty('scheme') && req.scheme.hasOwnProperty('render_sync')) {
          req.scheme.render_sync('error',context,function(err, data) {
            if (err) {
              var body = JSON.stringify(err);
              res.write('<code>' + body + '</code>\n');
            } else {
              res.write(data);
            }
          });
        } else {
          var body = JSON.stringify(err);
          res.write('<code>' + body + '</code>\n');
        }
      }
      res.end();
      
    }
  };
}

exports = module.exports = handleError;