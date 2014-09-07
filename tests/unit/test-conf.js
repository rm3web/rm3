var Conf = require ('../../lib/conf');
var test = require('tape');

test('conf', function (t) {
  // dummy test: make this better when conf develops
  t.plan(1);
  var conString = Conf.get_endpoint('postgres');

  t.deepEqual(conString, 'postgresql://wirehead:rm3test@127.0.0.1/rm3test');

  t.end();
});