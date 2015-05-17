var Conf = require('./conf');
var conString = Conf.getEndpoint('postgres');
var uuid = require('node-uuid');
var pg = Conf.getDriver('postgres');
var util = require('util'),
    errs = require('errs');

function DbError() {
  this.pgEndpoint = conString;
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

exports.openTransaction = function(client, done, callback) {
  client.query('BEGIN', function(err, result) {
    if (err) {
      var wrappedError = errs.merge(err, 'db');
      return callback(wrappedError);
    }
    callback(err, client, done);
  });
};

exports.commitTransaction = function(client, callback) {
  client.query('COMMIT', function(err, result) {
    if (err) {
      var wrappedError = errs.merge(err, 'db.commit_failed');
      return callback(wrappedError);
    }
    callback(err);
  });
};

exports.rollbackTransaction = function(client, callback) {
  // From the pg module docs:
  //if there was a problem rolling back the query
  //something is seriously messed up.  Return the error
  //to the done function to close & remove this client from
  //the pool.  If you leave a client in the pool with an unaborted
  //transaction __very bad things__ will happen.
  client.query('ROLLBACK', function(err, result) {
    if (err) {
      var wrappedError = errs.merge(err, 'db.rollback_failed');
      return callback(wrappedError);
    }
    callback(err);
  });
};

function handleConnectError(err, queryfunc, done) {
  var wrappedError = err;
  if (err.message.match(/^could not connect to server: Connection refused/)) {
    wrappedError = errs.merge(err, 'db.connection_refused');
    done(err);
    return queryfunc(wrappedError, function() {});
  } else {
    wrappedError = errs.merge(err, 'db');
    done(err);
    return queryfunc(wrappedError, function() {});
  }
}

exports.wrapError = function(err) {
  var wrappedError = err;
  if (err.message.match(/^could not connect to server: Connection refused/)) {
    wrappedError = errs.merge(err, 'db.connection_refused');
  } else if (err.message.match(/duplicate key value violates unique constraint/)) {
    wrappedError = errs.merge(err, 'db.duplicate_record');
  } else if (err.message.match(/relation .* does not exist/)) {
    wrappedError = errs.merge(err, 'db.table_missing');
  } else {
    wrappedError = errs.merge(err, 'db');
  }
  return wrappedError;
};

exports.connectWrap = function(queryfunc) {
  pg.connect(conString, function(err, client, done) {
    if (err) {
      return handleConnectError(err, queryfunc, done);
    }
    queryfunc(err, client, done);
  });
};

exports.gunDatabase = function() {
  pg.connect(conString, function(err, client, done) {
    if (err) {
      return handleConnectError(err, function() {}, done);
    }
    client.end();
  });
};
