var path_map = require('../../lib/middleware/path_map');
var test = require('tape');
var async = require('async');
var sitepath = require ('../../lib/sitepath');

test('middleware path_map', function (t) {
  
  t.plan(3);

  var res = {};

  var middleware = path_map();
  t.deepEqual(typeof middleware, "function");

  async.parallel([
    function(callback) {
      var req = {path: '/'};
      middleware(req, res, function()
      {
        t.deepEqual(req.sitepath, new sitepath(['wh']));
        callback();
      });
    },
    function(callback) {
      var req = {path: '/wh/'};
      middleware(req, res, function()
      {
        t.deepEqual(req.sitepath, new sitepath(['wh','wh']));
        callback();
      });
    }
  ], function(err, results)
  {
    t.end();
  });
    
  

});