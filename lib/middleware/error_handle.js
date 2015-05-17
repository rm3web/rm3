exports = module.exports = function() {
  return function handleError(err, req, res, next) {
    if (err) {
      var code = 500, header = 'Internal Error', body = JSON.stringify(err);
      if (err.hasOwnProperty('httpResponseCode')) {
        code = err.httpResponseCode;
      }
      if (err.hasOwnProperty('message')) {
        header = err.message;
      }
      res.writeHead(code, header, {});
      if (req.method !== 'HEAD') {
        res.write('<code>' + body + '</code>\n');
      }
      res.end();
    }
  };
};
