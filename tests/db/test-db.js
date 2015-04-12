var Conf = require ('../../lib/conf');
var entity = require('../../lib/entity');
var sitepath = require ('../../lib/sitepath');
var async = require('async');
var db = require('../../lib/db');
var should = require('should');
require('mocha-steps');
var Plan = require('test-plan');

describe('db', function() {
  describe('db test sequence', function (done) {
    var client, db_done;
    step('connect', function(next) {
      db.connect_wrap(function(err, cl, dbd) {
        if(err){
          should.fail();
        }
        dbd.should.be.an.instanceof(Function);
        cl.should.be.an.instanceof(Object);
        client = cl;
        db_done = dbd;
        should.deepEqual(client.database,"rm3unit");

        next();
      });
    });
    step('query', function(next) {
      client.query({
        text: 'SELECT $1::int AS number',
        values: [1],
        name: 'test-db-1'
      }, function(err, result){
        result.rows.should.be.an.instanceof(Array);
        result.rows[0].number.should.equal(1);
        
        db_done();
        if(err) {
          should.fail(err);
        }
        
        next();
      });
    });
  });

  describe('query failures', function() {
    var client;
    beforeEach(function() {
      client = {
        query: function(q, callback) {
          callback(new Error('ffffff'));
        }
      };
    });

    it('should handle open_transaction errors', function(next) {
      db.open_transaction(client, undefined, function(err){
        if (err) {
          should.deepEqual(err.name,'DbError');
        } else {
          should.fail('should call an error');
        }
        next();
      });
    });

    it('should handle commit_transaction errors', function(next) {
      db.commit_transaction(client, function(err){
        if (err) {
          should.deepEqual(err.name,'DbCommitFailedError');
        } else {
          should.fail('should call an error');
        }
        next();
      });
    });

    it('should handle rollback_transaction errors', function(next) {
      db.rollback_transaction(client, function(err){
        if (err) {
          should.deepEqual(err.name,'DbRollbackFailedError');
        } else {
          should.fail('should call an error');
        }
        next();
      });
    });
  });

  
  it('should wrap errors', function () {

    var err = db.wrap_error(new Error('could not connect to server: Connection refused'));
    should.deepEqual(err.name, 'DbConnectionRefusedError');
    err = db.wrap_error(new Error('relation wh_frro does not exist'));
    should.deepEqual(err.name, 'DbTableMissingError');

  });

  after(function() {
    db.gun_database();
  });
});