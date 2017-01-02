var pageMap = require('../../lib/middleware/page_map');
var should = require('chai').should();
var util = require('util'),
    errs = require('errs');

function mockReq() {
  var req = {};
  req.user = {};
  req.ctx = {};
  return req;
}

describe('middleware:fetchEntity', function() {
  var res = {};
  var protoSet = {};
  var req;

  beforeEach(function() {
    req = mockReq();
  });

  it('should work for proto entity', function(done) {
    req.entity = {'_proto': 'pony'};
    protoSet.getPage = function(proto) {
      proto.should.equal('pony');
      return {'page': true};
    };

    var middleware = pageMap(protoSet);

    middleware.should.be.a("function");

    middleware(req, res, function() {
      req.protoset.should.eql(protoSet);
      req.page.should.eql({'page': true});
      done();
    });

  });

  it('should work for proto entity', function(done) {
    req.entity = {};
    req.query = {type: 'cat'};
    protoSet.getPage = function(proto) {
      proto.should.equal('cat');
      return {'page': true};
    };

    var middleware = pageMap(protoSet);

    middleware.should.be.a("function");

    middleware(req, res, function() {
      req.protoset.should.eql(protoSet);
      req.page.should.eql({'page': true});
      done();
    });

  });

  it('should work for bad proto', function(done) {
    req.entity = {};
    req.query = {type: 'cat'};
    protoSet.getPage = function(proto) {
      return undefined;
    };

    var middleware = pageMap(protoSet);

    middleware.should.be.a("function");

    middleware(req, res, function(err) {
      should.exist(err);
      err.message.should.equal('Bad proto retrieved from database');
      done();
    });

  });
});
