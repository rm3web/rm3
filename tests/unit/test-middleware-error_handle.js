var errorHandle = require('../../lib/middleware/error_handle');
var should = require('chai').should();
var util = require('util'),
    errs = require('errs');
var Plan = require('test-plan');

describe('middleware:errorHandle', function() {

  var tests = [
    {code: 403,
      middleware: errorHandle.handle403,
      name: '#handle403'},
    {code: 404,
      middleware: errorHandle.handle404,
      name: '#handle404'},
    {code: 410,
      middleware: errorHandle.handle410,
      name: '#handle410'},
    {code: 429,
      middleware: errorHandle.handle429,
      name: '#handle429'}
  ];

  tests.forEach(function(test, index) {
    describe(test.name, function() {
      var middleware = test.middleware;
      middleware.should.be.a("function");
      var req, res;
      var plan;

      beforeEach(function() {
        req = {};
        res = {};
        req.scheme = {};
        res.cacheControl = {};
        res.status = function(code) {
          code.should.equal(test.code);
          plan.ok(true);
        };
        res.set = function(header, value) {

        };
        res.cacheControl.noCache = function() {
          plan.ok(true);
        };
        req.scheme.renderSync = function(view, data, callback) {
          plan.ok(true);
          callback(null, 'render_sync output');
        };
      });

      it('will let you set a response code', function(cb) {
        plan = new Plan(5, cb);
        var err = new Error();
        err.httpResponseCode = test.code;
        res.write = function(str) {
          plan.ok(true);
          str.should.equal('render_sync output');
        };
        res.end = function() {
          plan.ok(true);
        };
        middleware(err, req, res, function() {
          should.fail();
        });
      });

      it('will bypass a response it can\'t handle', function(cb) {
        var err = new Error();
        err.httpResponseCode = 550;
        res.write = function(str) {
          should.fail();
        };
        res.end = function() {
          should.fail();
        };
        middleware(err, req, res, function(err) {
          should.exist(err);
          cb();
        });
      });
    });
  });

  describe('#fallThrough', function() {
    var middleware = errorHandle.errorFallThrough;
    middleware.should.be.a("function");
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

    context('in non-HEAD mode', function() {

      context('with schemes non-functional', function() {

        it('will render with no scheme object', function(cb) {
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

        it('will render with a bad scheme object', function(cb) {
          var err = new Error();
          req.scheme = {};
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

        it('will render with a failed scheme object', function(cb) {
          var err = new Error();
          req.scheme = {};
          req.scheme.renderSync = function(view, data, callback) {
            callback(new Error());
          };
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

      });

      context('with schemes functional', function() {
        var plan;

        beforeEach(function() {
          req.scheme = {};
          req.scheme.renderSync = function(view, data, callback) {
            plan.ok(true);
            callback(null, 'render_sync output');
          };
        });

        it('will throw a 500 with random exceptions', function(cb) {
          plan = new Plan(4, cb);
          var err = new Error();
          res.writeHead = function(code, str, data) {
            code.should.equal(500);
            plan.ok(true);
            str.should.equal('Internal Error');
          };
          res.write = function(str) {
            str.should.equal('render_sync output');
            plan.ok(true);
          };
          res.end = function() {
            plan.ok(true);
          };
          middleware(err, req, res, function() {
            should.fail();
          });
        });

        it('will let you set a response code', function(cb) {
          plan = new Plan(4, cb);
          var err = new Error();
          err.httpResponseCode = 404;
          res.writeHead = function(code, str, data) {
            code.should.equal(404);
            plan.ok(true);
            str.should.equal('Internal Error');
          };
          res.write = function(str) {
            plan.ok(true);
            str.should.equal('render_sync output');
          };
          res.end = function() {
            plan.ok(true);
          };
          middleware(err, req, res, function() {
            should.fail();
          });
        });

        it('will let you set a message', function(cb) {
          plan = new Plan(4, cb);
          var err = new Error();
          err.message = 'Silly Error';
          res.writeHead = function(code, str, data) {
            code.should.equal(500);
            str.should.equal('Silly Error');
            plan.ok(true);
          };
          res.write = function(str) {
            str.should.equal('render_sync output');
            plan.ok(true);
          };
          res.end = function() {
            plan.ok(true);
          };
          middleware(err, req, res, function() {
            should.fail();
          });
        });

        it('will let you set a message getter', function(cb) {
          plan = new Plan(5, cb);
          var err = new Error();
          err.message = 'Bad Error';
          err.getMessage = function() {
            plan.ok(true);
            return 'Silly Error';
          };
          res.writeHead = function(code, str, data) {
            code.should.equal(500);
            str.should.equal('Silly Error');
            plan.ok(true);
          };
          res.write = function(str) {
            str.should.equal('render_sync output');
            plan.ok(true);
          };
          res.end = function() {
            plan.ok(true);
          };
          middleware(err, req, res, function() {
            should.fail();
          });
        });
      });
    });
  });
});
