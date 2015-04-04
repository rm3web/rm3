var path_map = require('../../lib/middleware/path_map');
var sitepath = require ('../../lib/sitepath');
var should = require('should');

describe('middleware:path_map', function() {
  var res = {};

  var middleware = path_map();
  should.deepEqual(typeof middleware, "function");

  var tests = [
    {args: '/',       expected: new sitepath(['wh'])},
    {args: '/wh/',    expected: new sitepath(['wh','wh'])},
    {args: '/$new/wh/', expected: new sitepath(['wh', 'wh']), creation: '$new'}
  ];
  
  tests.forEach(function(test) {
    it('correctly maps ' + test.args, function(done) {
      var req = {path: test.args};
      middleware(req, res, function()
      {
        req.sitepath.should.eql(test.expected);
        if(test.hasOwnProperty('creation')) {
          req.creation.should.equal(test.creation);
        }
        done();
      });
    });
  });
});