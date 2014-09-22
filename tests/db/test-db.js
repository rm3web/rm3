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

  async.waterfall([
    db.connect_wrap,
    function(client, done, callback){
      t.deepEqual(client.database,"rm3unit");
      client.query({
        text: 'SELECT $1::int AS number',
        values: [1],
        name: 'test-db-1'
      }, function(err, result){
        callback(err, done, result);
      });
    }
  ], function(err, done, result) {
    done();
    if(err) {
      t.fail(err);
    }
    t.deepEqual(result.rows[0].number,1);
    db.gun_database();
    t.end();
  });
});


test.test('db open_transaction failure', function (t) {
  t.plan(2);
  var conString = 'postgresql://wirehead:rm3test@127.0.0.1/rm3unit';
  Conf._data.endpoints.postgres = conString;
  var db = require('../../lib/db');
  client = {
    query: function(q, callback) {
      callback(new Error('ffffff'));
    }
  };
  db.open_transaction(client, undefined, function(err){
    if (err) {
      t.pass('errored');
      t.deepEqual(err.name,'DbError');
    } else {
      t.fail('should call an error');
    }
    t.end();
  });
});

test.test('db commit_transaction failure', function (t) {
  t.plan(2);
  var conString = 'postgresql://wirehead:rm3test@127.0.0.1/rm3unit';
  Conf._data.endpoints.postgres = conString;
  var db = require('../../lib/db');
  client = {
    query: function(q, callback) {
      callback(new Error('ffffff'));
    }
  };
  db.commit_transaction(client, function(err){
    if (err) {
      t.pass('errored');
      t.deepEqual(err.name,'DbCommitFailedError');
    } else {
      t.fail('should call an error');
    }
    t.end();
  });
});

test.test('db rollback_transaction failure', function (t) {
  t.plan(2);
  var conString = 'postgresql://wirehead:rm3test@127.0.0.1/rm3unit';
  Conf._data.endpoints.postgres = conString;
  var db = require('../../lib/db');
  client = {
    query: function(q, callback) {
      callback(new Error('ffffff'));
    }
  };
  db.rollback_transaction(client, function(err){
    if (err) {
      t.pass('errored');
      t.deepEqual(err.name,'DbRollbackFailedError');
    } else {
      t.fail('should call an error');
    }
    t.end();
  });
});

test.test('db wrap_error', function (t) {
  t.plan(2);
  var conString = 'postgresql://wirehead:rm3test@127.0.0.1/rm3unit';
  Conf._data.endpoints.postgres = conString;
  var db = require('../../lib/db');
  err = db.wrap_error(new Error('could not connect to server: Connection refused'));
  t.deepEqual(err.name, 'DbConnectionRefusedError');
  err = db.wrap_error(new Error('relation wh_frro does not exist'));
  t.deepEqual(err.name, 'DbTableMissingError');
  t.end();

});