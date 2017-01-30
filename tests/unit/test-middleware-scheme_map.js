var schemeMap = require('../../lib/middleware/scheme_map');
var should = require('chai').should();
var util = require('util');

describe('middleware:contextCreate', function() {
  var scheme = {starlight: 'glimmer'};
  var middleware = schemeMap(scheme);
  middleware.should.be.a("function");
  var req, res;

  beforeEach(function() {
    req = {};
    res = {};
  });

  it('adds a requestId', function(cb) {
    middleware(req, res, function() {
      req.should.have.keys('scheme');
      req.scheme.should.eql(scheme);
      cb();
    });
  });
});
