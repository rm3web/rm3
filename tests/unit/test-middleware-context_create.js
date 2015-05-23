var contextCreate = require('../../lib/middleware/context_create');
var should = require('should');
var util = require('util'),
    errs = require('errs');

describe('middleware:contextCreate', function() {
  var middleware = contextCreate();
  should.deepEqual(typeof middleware, "function");
  var req, res;

  beforeEach(function() {
    req = {};
    res = {};
  });

  it('adds a requestId', function(cb) {
    middleware(req, res, function() {
      req.should.have.keys('ctx');
      req.ctx.should.have.keys('requestId');
      cb();
    });
  });
});