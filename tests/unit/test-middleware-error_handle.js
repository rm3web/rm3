var errorHandle = require('../../lib/middleware/error_handle');
var should = require('should');
var util = require('util'),
    errs = require('errs');

describe('middleware:errorHandle', function() {
  var middleware = errorHandle();
  should.deepEqual(typeof middleware, "function");
  var req, res;

  beforeEach(function() {
    req = {};
    res = {};
  });

  it('will obey HEAD', function(cb) {
    var err = new Error();
    req.method = 'HEAD';
    res.writeHead = function(code, str, data) {
      code.should.equal(500);
      str.should.equal('Internal Error');
    };
    res.write = function(str) {
      should.fail();
    };
    res.end = function() {
      cb();
    };
    middleware(err, req, res, function() {
      should.fail();
    });
  });

  it('will throw a 500 with random exceptions', function(cb) {
    var err = new Error();
    res.writeHead = function(code, str, data) {
      code.should.equal(500);
      str.should.equal('Internal Error');
    };
    res.write = function(str) {
      str.should.match(/Error/);
      str.should.match(/<code>/);
    };
    res.end = function() {
      cb();
    };
    middleware(err, req, res, function() {
      should.fail();
    });
  });

  it('will let you set a response code', function(cb) {
    var err = new Error();
    err.httpResponseCode = 404;
    res.writeHead = function(code, str, data) {
      code.should.equal(404);
      str.should.equal('Internal Error');
    };
    res.write = function(str) {
      str.should.match(/Error/);
      str.should.match(/<code>/);
    };
    res.end = function() {
      cb();
    };
    middleware(err, req, res, function() {
      should.fail();
    });
  });

  it('will let you set a message', function(cb) {
    var err = new Error();
    err.message = 'Silly Error';
    res.writeHead = function(code, str, data) {
      code.should.equal(500);
      str.should.equal('Silly Error');
    };
    res.write = function(str) {
      str.should.match(/Error/);
      str.should.match(/<code>/);
    };
    res.end = function() {
      cb();
    };
    middleware(err, req, res, function() {
      should.fail();
    });
  });
});