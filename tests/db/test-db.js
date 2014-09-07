var Conf = require ('../../lib/conf');
var test = require('tape');
var entity = require('../../lib/entity');
var sitepath = require ('../../lib/sitepath');
var async = require('async');

test.test('db', function (t) {
  t.plan(2);
  var conString = 'postgresql://wirehead:rm3test@127.0.0.1/rm3unit';
  Conf._data.endpoints.postgres = conString;
  var db = require('../../lib/db');

  db.connect_wrap(function(client, done) {
    t.deepEqual(client.database,"rm3unit");
    var select = client.query({
      text: 'SELECT $1::int AS number',
      values: [1],
      name: 'test-db-1'
    }, function(err, result) {
      done();
      if(err) {
        t.fail(err);
      }
      t.deepEqual(result.rows[0].number,1);
      db.gun_database();
      t.end();
    });
  });
});
