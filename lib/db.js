var Conf = require('./conf');
var conString = Conf.get_endpoint('postgres');
var uuid = require('node-uuid');
var pg = Conf.get_driver('postgres');
var util = require('util'),
    errs = require('errs');

function DbError() {
  this.pg_endpoint = conString;
}
util.inherits(DbError, Error);

function DbConnectionRefused() {
  this.message = "Could not connect the database server"
}
util.inherits(DbConnectionRefused, DbError);

errs.register('db', DbError);
errs.register('db.connection_refused', DbConnectionRefused);

exports.open_transaction = function(client, done, callback) {
  client.query('BEGIN', function(err, result) {
    callback(err, client, done);
  });
}

function handle_connect_error(err, queryfunc, done) {
  if (err.message.match(/^could not connect to server: Connection refused/)) {
    var wrapped_error = errs.merge(err, 'db.connection_refused')
    done(err);
    return queryfunc(wrapped_error);
  } else {
    var wrapped_error = errs.merge(err, 'db')
    done(err);
    return queryfunc(wrapped_error);
  }
}

exports.connect_wrap = function (queryfunc) {
  pg.connect(conString, function(err, client, done) {
    if(err) {
      return handle_connect_error(err, queryfunc, done);
    }
    queryfunc(err, client, done);
  });
};

exports.gun_database = function () {
  pg.connect(conString, function(err, client, done) {
    if(err) {
      return handle_connect_error(err, queryfunc, done);
    }
    client.end();
  });
};