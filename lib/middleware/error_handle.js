exports = module.exports = function() {
  return function fetch_snippet(err, req, res, next) {
    if (err) {
      var code = 500, header = 'Internal Error', body = JSON.stringify(err);
      if (err.hasOwnProperty('http_error_code')) {
        code = err.http_error_code;
      }
      if (err.hasOwnProperty('message')) {
        header = err.message;
      }
      res.writeHead(code, header, {});
      if (req.method !== 'HEAD') {
        res.write(body + '\n');
      }
      res.end();
    }
  };
};