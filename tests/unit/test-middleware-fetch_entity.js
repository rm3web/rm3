var fetch_entity = require('../../lib/middleware/fetch_entity');
var test = require('tape');
var sitepath = require ('../../lib/sitepath');

test('middleware fetch_entity', function (t) {
  
  t.plan(5);
  var query = {};
  var entity = {};
  var req = {};
  var res = {};

  query.entity_from_path = function(ent, sp, rev, next) {
    t.deepEqual(entity, ent);
    t.deepEqual(sp, new sitepath(['sparklepony']));
    t.deepEqual(rev, null)
    next(null, {e: 'st'})
  };

  var middleware = fetch_entity(query, entity);
  t.deepEqual(typeof middleware, "function");

  req.sitepath = new sitepath(['sparklepony']);

  middleware(req, res, function()
  {
    t.deepEqual(req.entity, {e: 'st'})
    t.end();
  })

});