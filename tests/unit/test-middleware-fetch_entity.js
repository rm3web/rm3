var fetchEntity = require('../../lib/middleware/fetch_entity');
var should = require('should');
var sitepath = require ('../../lib/sitepath');
var util = require('util'),
    errs = require('errs');

function mockReq(path) {
  var req = {};
  req.sitepath = new sitepath(path);
  req.user = {};
  req.ctx = {};
  req.user.path = function() {
    return 'wh';
  };
  return req;
}

describe('middleware:fetchEntity', function() {
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
      req = mockReq(['sparklepony']);
    });

    it('should fetch an entity', function(done) {
      query.entityFromPath = function(db, ent, ctx, acc, sp, rev, next) {
        ent.should.eql(entity);
        sp.should.eql(new sitepath(['sparklepony']));
        should.deepEqual(rev, null);
        next(null, {e: 'st'});
      };

      var middleware = fetchEntity(db, query, entity);
      should.deepEqual(typeof middleware, "function");

      middleware(req, res, function() {
        req.entity.should.eql({e: 'st'});
        done();
      });

    });

    it('middleware fetchEntity revision_id', function(done) {
      req.query = {};
      req.query.revisionId = '11111111-1111-1111-a111-111111111111';

      query.entityFromPath = function(db, ent, ctx, acc, sp, rev, next) {
        ent.should.eql(entity);
        sp.should.eql(new sitepath(['sparklepony']));
        should.deepEqual(rev, '11111111-1111-1111-a111-111111111111');
        next(null, {e: 'sr'});
      };

      var middleware = fetchEntity(db, query, entity);
      should.deepEqual(typeof middleware, "function");

      middleware(req, res, function() {
        req.entity.should.eql({e: 'sr'});
        done();
      });
    });

    it('middleware fetchEntity bad revision_id', function(done) {
      req.query = {};
      req.query.revisionId = '11111111-1111-1111-a111';

      query.entityFromPath = function(db, ent, ctx, acc, sp, rev, next) {
        ent.should.eql(entity);
        sp.should.eql(new sitepath(['sparklepony']));
        should.deepEqual(rev, null);
        next(null, {e: 'sq'});
      };

      var middleware = fetchEntity(db, query, entity);
      should.deepEqual(typeof middleware, "function");

      middleware(req, res, function() {
        req.entity.should.eql({e: 'sq'});
        done();
      });
    });

    it('middleware fetchEntity not_found_error', function(done) {
      function EntityNotFoundError() {
        this.message = "Entity not found";
      }
      util.inherits(EntityNotFoundError, Error);
      errs.register('query.not_found', EntityNotFoundError);

      query.entityFromPath = function(db, ent, ctx, acc, sp, rev, next) {
        next(errs.create('query.not_found', {
            path: 'sparklepony',
            revisionId: null
          }));
      };

      var middleware = fetchEntity(db, query, entity);
      should.deepEqual(typeof middleware, "function");

      middleware(req, res, function(err) {
        should.deepEqual(err.name, 'PathNotFoundError');
        should.deepEqual(err.httpResponseCode, 404);
        done();
      });

    });

    it('middleware fetchEntity db_error', function(done) {
      query.entityFromPath = function(db, ent, ctx, acc, sp, rev, next) {
        next(new Error("Connection was ended during query"));
      };

      var middleware = fetchEntity(db, query, entity);
      should.deepEqual(typeof middleware, "function");

      middleware(req, res, function(err) {
        should.deepEqual(err.name, 'Error');
        done();
      });

    });

    it('middleware fetchEntity db_error2', function(done) {
      function OtherKindOfError() {
        this.message = "Other kind of error";
      }
      util.inherits(OtherKindOfError, Error);
      errs.register('otherkind', OtherKindOfError);

      query.entityFromPath = function(db, ent, ctx, acc, sp, rev, next) {
        next(errs.create('otherkind', {
            path: 'sparklepony',
            revisionId: null
          }));
      };

      var middleware = fetchEntity(db, query, entity);
      should.deepEqual(typeof middleware, "function");

      middleware(req, res, function(err) {
        should.deepEqual(err.name, 'OtherKindOfError');
        done();
      });

    });
  });

  context('with creation paramater', function() {
    var req;
    beforeEach(function() {
      req = mockReq(['sparklepony']);
      req.creation = '$bonkers';
    });

    it('middleware fetchEntity create', function(done) {
      var entity = function() {
        return {e:'rr'};
      };

      query.entityFromPath = function(db, ent, ctx, acc, sp, rev, next) {
        should.fail('this shouldn\'t be called');
      };

      var middleware = fetchEntity(db, query, entity);
      should.deepEqual(typeof middleware, "function");

      middleware(req, res, function() {
        req.entity.should.eql({e: 'rr'});
        done();
      });

    });
  });

});
