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

function DbConnectionRefusedError() {
  this.message = "Could not connect the database server";
}
util.inherits(DbConnectionRefusedError, DbError);

function DbCommitFailedError() {
  this.message = "Commit failed!";
}
util.inherits(DbCommitFailedError, DbError);

function DbRollbackFailedError() {
  this.message = "Rollback failed!";
}
util.inherits(DbCommitFailedError, DbError);

function DbTableMissingError() {
  this.message = "Table missing";
}
util.inherits(DbCommitFailedError, DbError);

function DbDuplicateRecordError() {
  this.message = "There's a duplicate record";
}
util.inherits(DbCommitFailedError, DbError);

errs.register('db', DbError);
errs.register('db.table_missing', DbTableMissingError);
errs.register('db.connection_refused', DbConnectionRefusedError);
errs.register('db.commit_failed', DbCommitFailedError);
errs.register('db.rollback_failed', DbRollbackFailedError);
errs.register('db.duplicate_record', DbDuplicateRecordError);

exports.open_transaction = function(client, done, callback) {
  client.query('BEGIN', function(err, result) {
    if (err) {
      var wrapped_error = errs.merge(err, 'db');
      return callback(wrapped_error);
    }
    callback(err, client, done);
  });
};

exports.commit_transaction = function(client, callback) {
  client.query('COMMIT', function(err, result) {
    if (err) {
      var wrapped_error = errs.merge(err, 'db.commit_failed');
      return callback(wrapped_error);
    }
    callback(err);
  });
};

exports.rollback_transaction = function(client, callback) {
  // From the pg module docs:
  //if there was a problem rolling back the query
  //something is seriously messed up.  Return the error
  //to the done function to close & remove this client from
  //the pool.  If you leave a client in the pool with an unaborted
  //transaction __very bad things__ will happen.
  client.query('ROLLBACK', function(err, result) {
    if (err) {
      var wrapped_error = errs.merge(err, 'db.rollback_failed');
      return callback(wrapped_error);
    }
    callback(err);
  });
};

function handle_connect_error(err, queryfunc, done) {
  var wrapped_error = err;
  if (err.message.match(/^could not connect to server: Connection refused/)) {
    wrapped_error = errs.merge(err, 'db.connection_refused');
    done(err);
    return queryfunc(wrapped_error, function() {});
  } else {
    wrapped_error = errs.merge(err, 'db');
    done(err);
    return queryfunc(wrapped_error, function() {});
  }
}

exports.wrap_error = function (err) {
  var wrapped_error = err;
  if (err.message.match(/^could not connect to server: Connection refused/)) {
    wrapped_error = errs.merge(err, 'db.connection_refused');
  } else if (err.message.match(/duplicate key value violates unique constraint/)) {
    wrapped_error = errs.merge(err, 'db.duplicate_record');
  } else if (err.message.match(/relation .* does not exist/)) {
    wrapped_error = errs.merge(err, 'db.table_missing');
  } else {
    wrapped_error = errs.merge(err, 'db');
  }
  return wrapped_error;
};

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