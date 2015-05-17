var fetch_entity = require('../../lib/middleware/fetch_entity');
var should = require('should');
var sitepath = require ('../../lib/sitepath');
var util = require('util'),
    errs = require('errs');

function mock_req(path) {
  var req = {};
  req.sitepath = new sitepath(path);
  req.user = {};
  req.user.path = function() {
    return 'wh';
  };
  return req;
}

describe('middleware:fetch_entity', function() {
  var res = {};
  var query, db;

  beforeEach(function() {
    query = {};
    db = {};
  });

  context('without creation paramater', function() {
    var req;
    var entity = {};

    beforeEach(function() {
      req = mock_req(['sparklepony']);
    });

    it('should fetch an entity', function (done) {
      query.entityFromPath = function(db, ent, acc, sp, rev, next) {
        ent.should.eql(entity);
        sp.should.eql(new sitepath(['sparklepony']));
        should.deepEqual(rev,null);
        next(null, {e: 'st'});
      };

      var middleware = fetch_entity(db, query, entity);
      should.deepEqual(typeof middleware, "function");

      middleware(req, res, function()
      {
        req.entity.should.eql({e: 'st'});
        done();
      });

    });

    it('middleware fetch_entity revision_id', function (done) {
      req.query = {};
      req.query.revisionId = '11111111-1111-1111-a111-111111111111';

      query.entityFromPath = function(db, ent, acc, sp, rev, next) {
        ent.should.eql(entity);
        sp.should.eql(new sitepath(['sparklepony']));
        should.deepEqual(rev, '11111111-1111-1111-a111-111111111111');
        next(null, {e: 'sr'});
      };

      var middleware = fetch_entity(db, query, entity);
      should.deepEqual(typeof middleware, "function");

      middleware(req, res, function()
      {
        req.entity.should.eql({e: 'sr'});
        done();
      });
    });

    it('middleware fetch_entity bad revision_id', function (done) {
      req.query = {};
      req.query.revision_id = '11111111-1111-1111-a111';

      query.entityFromPath = function(db, ent, acc, sp, rev, next) {
        ent.should.eql(entity);
        sp.should.eql(new sitepath(['sparklepony']));
        should.deepEqual(rev, null);
        next(null, {e: 'sq'});
      };

      var middleware = fetch_entity(db, query, entity);
      should.deepEqual(typeof middleware, "function");

      middleware(req, res, function()
      {
        req.entity.should.eql({e: 'sq'});
        done();
      });
    });

    it('middleware fetch_entity not_found_error', function (done) {
      function EntityNotFoundError() {
        this.message = "Entity not found";
      }
      util.inherits(EntityNotFoundError, Error);
      errs.register('query.not_found', EntityNotFoundError);

      query.entityFromPath = function(db, ent, acc, sp, rev, next) {
        next(errs.create('query.not_found', {
            path: 'sparklepony',
            revision_id: null
          }));
      };

      var middleware = fetch_entity(db, query, entity);
      should.deepEqual(typeof middleware, "function");

      middleware(req, res, function(err)
      {
        should.deepEqual(err.name,'NotFoundError');
        should.deepEqual(err.httpResponseCode, 404);
        done();
      });

    });

    it('middleware fetch_entity db_error', function (done) {
      query.entityFromPath = function(db, ent, acc, sp, rev, next) {
        next(new Error("Connection was ended during query"));
      };

      var middleware = fetch_entity(db, query, entity);
      should.deepEqual(typeof middleware, "function");

      middleware(req, res, function(err)
      {
        should.deepEqual(err.name,'Error');
        done();
      });

    });

    it('middleware fetch_entity db_error2', function (done) {
      function OtherKindOfError() {
        this.message = "Other kind of error";
      }
      util.inherits(OtherKindOfError, Error);
      errs.register('otherkind', OtherKindOfError);

      query.entityFromPath = function(db, ent, acc, sp, rev, next) {
        next(errs.create('otherkind', {
            path: 'sparklepony',
            revision_id: null
          }));
      };

      var middleware = fetch_entity(db, query, entity);
      should.deepEqual(typeof middleware, "function");

      middleware(req, res, function(err)
      {
        should.deepEqual(err.name,'OtherKindOfError');
        done();
      });

    });
  });

  context('with creation paramater', function() {
    var req;
    beforeEach(function() {
      req = mock_req(['sparklepony']);
      req.creation = '$bonkers';
    });

    it('middleware fetch_entity create', function (done) {
      var entity = function() {
        return {e:'rr'};
      };

      query.entityFromPath = function(db, ent, acc, sp, rev, next) {
        should.fail('this shouldn\'t be called');
      };

      var middleware = fetch_entity(db, query, entity);
      should.deepEqual(typeof middleware, "function");

      middleware(req, res, function()
      {
        req.entity.should.eql({e: 'rr'});
        done();
      });

    });
  });

});