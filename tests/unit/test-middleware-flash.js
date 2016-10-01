var flash = require('../../lib/middleware/flash');
var should = require('chai').should();
var util = require('util'),
    errs = require('errs');

describe('middleware:flash', function() {
  var middleware = flash();
  middleware.should.be.a("function");
  var req, res;

  beforeEach(function() {
    req = {session: {}};
    res = {};
  });

  it('should no-op normally', function(cb) {
    middleware(req, res, function() {
      req.session.should.eql({});
      cb();
    });
  });

  it('should not add a session unnecessarily', function(cb) {
    middleware(req, res, function() {
      var msgs = req.getFlashMsgs();
      msgs.should.eql([]);
      msgs = req.getFlashMsgs('error');
      msgs.should.eql([]);
      req.session.should.eql({});
      cb();
    });
  });

  it('should work', function(cb) {
    middleware(req, res, function() {
      req.flash('error', 'error message');
      var msgs = req.getFlashMsgs('error');
      msgs.should.eql(['error message']);
      req.session.should.eql({flash: {}});
      cb();
    });
  });

  it('should work on a saved session', function(cb) {
    req.session = {flash:{error:['error message']}};
    middleware(req, res, function() {
      var msgs = req.getFlashMsgs('error');
      msgs.should.eql(['error message']);
      req.session.should.eql({flash: {}});
      cb();
    });
  });

  it('should work with multiple messages', function(cb) {
    req.session = {flash:{error:['error message']}};
    middleware(req, res, function() {
      req.flash('error', 'error message 2');
      var msgs = req.getFlashMsgs('error');
      msgs.should.eql(['error message', 'error message 2']);
      req.session.should.eql({flash: {}});
      cb();
    });
  });
});
