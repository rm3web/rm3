var fetchEntity = require('../../lib/middleware/fetch_entity');
var should = require('chai').should();
var sitepath = require ('sitepath');
var util = require('util'),
    errs = require('errs');

function StubEntity() {
}

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
      query.entityFromPath = function(db, cache, ent, ctx, acc, sp, rev, next) {
        ent.should.eql(entity);
        sp.should.eql(new sitepath(['sparklepony']));
        should.not.exist(rev);
        next(null, {e: 'st'});
      };

      var middleware = fetchEntity(db, {}, query, entity, StubEntity);

      middleware.should.be.a("function");

      middleware(req, res, function() {
        req.entity.should.eql({e: 'st'});
        done();
      });

    });

    it('middleware fetchEntity revision_id', function(done) {
      req.query = {};
      req.query.revisionId = '11111111-1111-1111-a111-111111111111';

      query.entityFromPath = function(db, cache, ent, ctx, acc, sp, rev, next) {
        ent.should.eql(entity);
        sp.should.eql(new sitepath(['sparklepony']));
        rev.should.equal('11111111-1111-1111-a111-111111111111');
        next(null, {e: 'sr'});
      };

      var middleware = fetchEntity(db, {}, query, entity, StubEntity);
      middleware.should.be.a("function");

      middleware(req, res, function() {
        req.entity.should.eql({e: 'sr'});
        done();
      });
    });

    it('middleware fetchEntity revision_id post', function(done) {
      req.body = {};
      req.body.revisionId = '11111111-1111-1111-a111-111111111111';

      query.entityFromPath = function(db, cache, ent, ctx, acc, sp, rev, next) {
        ent.should.eql(entity);
        sp.should.eql(new sitepath(['sparklepony']));
        rev.should.equal('11111111-1111-1111-a111-111111111111');
        next(null, {e: 'sr'});
      };

      var middleware = fetchEntity(db, {}, query, entity, StubEntity);
      middleware.should.be.a("function");

      middleware(req, res, function() {
        req.entity.should.eql({e: 'sr'});
        done();
      });
    });

    it('middleware fetchEntity bad revision_id', function(done) {
      req.query = {};
      req.query.revisionId = '11111111-1111-1111-a111';

      query.entityFromPath = function(db, cache, ent, ctx, acc, sp, rev, next) {
        ent.should.eql(entity);
        sp.should.eql(new sitepath(['sparklepony']));
        should.not.exist(rev);
        next(null, {e: 'sq'});
      };

      var middleware = fetchEntity(db, {}, query, entity, StubEntity);
      middleware.should.be.a("function");

      middleware(req, res, function() {
        req.entity.should.eql({e: 'sq'});
        done();
      });
    });

    it('middleware fetchEntity revision_id unauthorized', function(done) {
      req.query = {};
      req.query.revisionId = '11111111-1111-1111-a111-111111111111';

      query.entityFromPath = function(db, cache, ent, ctx, acc, sp, rev, next) {
        ent.should.eql(entity);
        sp.should.eql(new sitepath(['sparklepony']));
        rev.should.equal('11111111-1111-1111-a111-111111111111');
        next(null, {e: 'sr', permissions: {}, curLogRev: {evtFinal: false}});
      };

      var middleware = fetchEntity(db, {}, query, entity, StubEntity);
      middleware.should.be.a("function");

      middleware(req, res, function(err) {
        err.name.should.equal('ForbiddenError');
        err.httpResponseCode.should.equal(403);
        done();
      });
    });

    it('middleware fetchEntity not_found_error', function(done) {
      function EntityNotFoundError() {
        this.message = "Entity not found";
      }
      util.inherits(EntityNotFoundError, Error);
      errs.register('query.not_found', EntityNotFoundError);

      query.entityFromPath = function(db, cache, ent, ctx, acc, sp, rev, next) {
        next(errs.create('query.not_found', {
          path: 'sparklepony',
          revisionId: null
        }));
      };

      var middleware = fetchEntity(db, {}, query, entity, StubEntity);
      middleware.should.be.a("function");

      middleware(req, res, function(err) {
        err.name.should.equal('PathNotFoundError');
        err.httpResponseCode.should.equal(404);
        done();
      });

    });

    it('middleware fetchEntity permissions_not_found_error', function(done) {
      function PermissionsNotFoundError() {
        this.message = "Entity not found";
      }
      util.inherits(PermissionsNotFoundError, Error);
      errs.register('query.permissions_not_found', PermissionsNotFoundError);

      query.entityFromPath = function(db, cache, ent, ctx, acc, sp, rev, next) {
        next(errs.create('query.permissions_not_found', {
          path: 'sparklepony',
          revisionId: null
        }));
      };

      var middleware = fetchEntity(db, {}, query, entity, StubEntity);
      middleware.should.be.a("function");

      middleware(req, res, function(err) {
        err.name.should.equal('ForbiddenError');
        err.httpResponseCode.should.equal(403);
        done();
      });
    });

    it('middleware fetchEntity gone', function(done) {
      query.entityFromPath = function(db, cache, ent, ctx, acc, sp, rev, next) {
        ent.should.eql(entity);
        sp.should.eql(new sitepath(['sparklepony']));
        should.not.exist(rev);
        next(null, new StubEntity());
      };

      var middleware = fetchEntity(db, {}, query, entity, StubEntity);
      middleware.should.be.a("function");

      middleware(req, res, function(err) {
        err.name.should.equal('GoneError');
        err.httpResponseCode.should.equal(410);
        done();
      });
    });

    it('middleware fetchEntity moved', function(done) {
      query.entityFromPath = function(db, cache, ent, ctx, acc, sp, rev, next) {
        ent.should.eql(entity);
        sp.should.eql(new sitepath(['sparklepony']));
        should.not.exist(rev);
        var tmpent = new StubEntity();
        tmpent.summary = {
          moved: true,
          path: 'wh'
        };
        next(null, tmpent);
      };

      req.site = {};
      req.site.sitePathToUrl = function() {
        return '/';
      };

      var middleware = fetchEntity(db, {}, query, entity, StubEntity);
      middleware.should.be.a("function");

      res.redirect = function(code, path) {
        code.should.eql(308);
        path.should.eql('/');
        done();
      };

      middleware(req, res, function(err) {
        should.fail('shouldn\'t be called');
      });
    });

    it('middleware fetchEntity redirect', function(done) {
      query.entityFromPath = function(db, cache, ent, ctx, acc, sp, rev, next) {
        ent.should.eql(entity);
        sp.should.eql(new sitepath(['sparklepony']));
        should.not.exist(rev);
        var tmpent = new StubEntity();
        tmpent.summary = {
          deleted: true,
          redirect: 'http://www.example.com/'
        };
        next(null, tmpent);
      };

      var middleware = fetchEntity(db, {}, query, entity, StubEntity);
      middleware.should.be.a("function");

      res.redirect = function(code, path) {
        code.should.eql(308);
        path.should.eql('http://www.example.com/');
        done();
      };

      middleware(req, res, function(err) {
        should.fail('shouldn\'t be called');
      });
    });

    it('middleware fetchEntity revision_not_found_error', function(done) {
      function RevisionIdNotFoundError() {
        this.message = "Entity not found";
      }
      util.inherits(RevisionIdNotFoundError, Error);
      errs.register('query.revision_id_not_found', RevisionIdNotFoundError);

      query.entityFromPath = function(db, cache, ent, ctx, acc, sp, rev, next) {
        next(errs.create('query.revision_id_not_found', {
          path: 'sparklepony',
          revisionId: null
        }));
      };

      var middleware = fetchEntity(db, {}, query, entity, StubEntity);
      middleware.should.be.a("function");

      middleware(req, res, function(err) {
        err.name.should.equal('RevisionNotFoundError');
        err.httpResponseCode.should.equal(400);
        done();
      });
    });

    it('middleware fetchEntity db_error', function(done) {
      query.entityFromPath = function(db, cache, ent, ctx, acc, sp, rev, next) {
        next(new Error("Connection was ended during query"));
      };

      var middleware = fetchEntity(db, {}, query, entity, StubEntity);
      middleware.should.be.a("function");

      middleware(req, res, function(err) {
        err.name.should.equal('Error');
        done();
      });

    });

    it('middleware fetchEntity db_error2', function(done) {
      function OtherKindOfError() {
        this.message = "Other kind of error";
      }
      util.inherits(OtherKindOfError, Error);
      errs.register('otherkind', OtherKindOfError);

      query.entityFromPath = function(db, cache, ent, ctx, acc, sp, rev, next) {
        next(errs.create('otherkind', {
          path: 'sparklepony',
          revisionId: null
        }));
      };

      var middleware = fetchEntity(db, {}, query, entity, StubEntity);
      middleware.should.be.a("function");

      middleware(req, res, function(err) {
        err.name.should.equal('OtherKindOfError');
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

      query.entityFromPath = function(db, cache, ent, ctx, acc, sp, rev, next) {
        should.fail('this shouldn\'t be called');
      };

      var middleware = fetchEntity(db, {}, query, entity, StubEntity);
      middleware.should.be.a("function");

      middleware(req, res, function() {
        req.entity.should.eql({e: 'rr'});
        done();
      });

    });
  });

});
