var fetch_entity = require('../../lib/middleware/fetch_entity');
var test = require('tape');
var sitepath = require ('../../lib/sitepath');
var util = require('util'),
    errs = require('errs');

function mock_req(path) {
  var req = {};
  req.sitepath = new sitepath(path);
  return req;
}

test('middleware fetch_entity', function (t) {
  
  t.plan(5);
  var query = {};
  var entity = {};
  var db = {};
  var req = mock_req(['sparklepony']);
  var res = {};

  query.entity_from_path = function(db, ent, acc, sp, rev, next) {
    t.deepEqual(entity, ent);
    t.deepEqual(sp, new sitepath(['sparklepony']));
    t.deepEqual(rev, null);
    next(null, {e: 'st'});
  };

  var middleware = fetch_entity(db, query, entity);
  t.deepEqual(typeof middleware, "function");

  middleware(req, res, function()
  {
    t.deepEqual(req.entity, {e: 'st'});
    t.end();
  });

});

test('middleware fetch_entity create', function (t) {
  
  t.plan(2);
  var query = {};
  var entity = function() {
    return {e:'rr'};
  };
  var db = {};
  var req = mock_req(['sparklepony']);
  req.creation = '$bonkers';
  var res = {};

  query.entity_from_path = function(db, ent, acc, sp, rev, next) {
    t.fail('this shouldn\'t be called');
  };

  var middleware = fetch_entity(db, query, entity);
  t.deepEqual(typeof middleware, "function");

  middleware(req, res, function()
  {
    t.deepEqual(req.entity, {e: 'rr'});
    t.end();
  });

});

test('middleware fetch_entity revision_id', function (t) {
  
  t.plan(5);
  var query = {};
  var entity = {};
  var db = {};
  var req = mock_req(['sparklepony']);
  req.query = {};
  req.query.revision_id = '11111111-1111-1111-a111-111111111111';
  var res = {};

  query.entity_from_path = function(db, ent, acc, sp, rev, next) {
    t.deepEqual(entity, ent);
    t.deepEqual(sp, new sitepath(['sparklepony']));
    t.deepEqual(rev, '11111111-1111-1111-a111-111111111111');
    next(null, {e: 'st'});
  };

  var middleware = fetch_entity(db, query, entity);
  t.deepEqual(typeof middleware, "function");

  middleware(req, res, function()
  {
    t.deepEqual(req.entity, {e: 'st'});
    t.end();
  });
});

test('middleware fetch_entity bad revision_id', function (t) {
  
  t.plan(5);
  var query = {};
  var entity = {};
  var db = {};
  var req = mock_req(['sparklepony']);
  req.query = {};
  req.query.revision_id = '11111111-1111-1111-a111';
  var res = {};

  query.entity_from_path = function(db, ent, acc, sp, rev, next) {
    t.deepEqual(entity, ent);
    t.deepEqual(sp, new sitepath(['sparklepony']));
    t.deepEqual(rev, null);
    next(null, {e: 'st'});
  };

  var middleware = fetch_entity(db, query, entity);
  t.deepEqual(typeof middleware, "function");

  middleware(req, res, function()
  {
    t.deepEqual(req.entity, {e: 'st'});
    t.end();
  });
});

test('middleware fetch_entity not_found_error', function (t) {
  
  t.plan(3);
  var query = {};
  var entity = {};
  var db = {};
  var req = mock_req(['sparklepony']);
  var res = {};

  function EntityNotFoundError() {
    this.message = "Entity not found";
  }
  util.inherits(EntityNotFoundError, Error);
  errs.register('query.not_found', EntityNotFoundError);

  query.entity_from_path = function(db, ent, acc, sp, rev, next) {
    next(errs.create('query.not_found', {
        path: 'sparklepony',
        revision_id: null
      }));
  };

  var middleware = fetch_entity(db, query, entity);
  t.deepEqual(typeof middleware, "function");

  middleware(req, res, function(err)
  {
    t.deepEqual(err.name,'NotFoundError');
    t.deepEqual(err.http_response_code, 404);
    t.end();
  });

});

test('middleware fetch_entity db_error', function (t) {
  
  t.plan(2);
  var query = {};
  var entity = {};
  var db = {};
  var req = mock_req(['sparklepony']);
  var res = {};

  query.entity_from_path = function(db, ent, acc, sp, rev, next) {
    next(new Error("Connection was ended during query"));
  };

  var middleware = fetch_entity(db, query, entity);
  t.deepEqual(typeof middleware, "function");

  middleware(req, res, function(err)
  {
    t.deepEqual(err.name,'Error');
    t.end();
  });

});

test('middleware fetch_entity db_error2', function (t) {
  
  t.plan(2);
  var query = {};
  var entity = {};
  var db = {};
  var req = mock_req(['sparklepony']);
  var res = {};

  function OtherKindOfError() {
    this.message = "Other kind of error";
  }
  util.inherits(OtherKindOfError, Error);
  errs.register('otherkind', OtherKindOfError);

  query.entity_from_path = function(db, ent, acc, sp, rev, next) {
    next(errs.create('otherkind', {
        path: 'sparklepony',
        revision_id: null
      }));
  };

  var middleware = fetch_entity(db, query, entity);
  t.deepEqual(typeof middleware, "function");

  middleware(req, res, function(err)
  {
    t.deepEqual(err.name,'OtherKindOfError');
    t.end();
  });

});