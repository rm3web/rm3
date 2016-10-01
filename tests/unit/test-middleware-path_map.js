var pathMap = require('../../lib/middleware/path_map');
var sitepath = require ('sitepath');
var should = require('chai').should();

describe('middleware:pathMap', function() {
  var res = {};

  var middleware = pathMap();
  middleware.should.be.a("function");

  var tests = [
    {args: '/',       expected: new sitepath(['wh'])},
    {args: '/wh/',    expected: new sitepath(['wh', 'wh'])},
    {args: '/$new/wh/', expected: new sitepath(['wh', 'wh']), creation: '$new'}
  ];

  tests.forEach(function(test) {
    it('correctly maps ' + test.args, function(done) {
      var req = {path: test.args, ctx: {}};
      middleware(req, res, function() {
        req.sitepath.should.eql(test.expected);
        if (test.hasOwnProperty('creation')) {
          req.creation.should.equal(test.creation);
        }
        done();
      });
    });
  });

  it('should throw when encountering an invalid path', function(cb) {
    var req = {path: 'wet==-wwrt---vbdfg.wretjh', ctx: {}};
    middleware(req, res, function(err) {
      err.message.should.equal('NOT_FOUND');
      err.name.should.equal('UnparsablePathError');
      cb();
    });
  });
});
