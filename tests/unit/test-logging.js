var logging = require('../../lib/logging');
var should = require('should');
var util = require('util'),
    errs = require('errs');
var Plan = require('test-plan');
var events = require("events");

function LoggingMockError() {
  this.message = "Logging Error Mock";
}
util.inherits(LoggingMockError, Error);
errs.register('loggingmock', LoggingMockError);


describe('logging', function() {
  var boundLogger, plan;

  context('triggered by a callback', function() {
    beforeEach(function() {
      boundLogger = {};
      boundLogger.error = function(message, data){
        message.should.equal('logging test');
        data.should.have.property('data','data');
        plan.ok(true);
      };
    });

    context('sending to a callback', function() {
      it('#logAndCreateError creates an error', function(cb) {
        plan = new Plan(2, cb);

        logging.logAndCreateError(boundLogger,'logging test','loggingmock',
          {data: 'data'}, function(err){
            err.should.have.property('data','data');
            err.should.be.an.instanceOf(LoggingMockError);
            plan.ok(true);
          });
      });

      it('#logAndCreateError creates an error', function(cb) {
        plan = new Plan(2, cb);
        var err = new Error();
        err.fear = 'beer';

        logging.logAndWrapError(boundLogger, err, 'logging test','loggingmock',
          {data: 'data'}, function(err){
            err.should.have.property('data','data');
            err.should.have.property('fear','beer');
            err.should.have.property('stacktrace');
            err.should.be.an.instanceOf(LoggingMockError);
            plan.ok(true);
          });
      });

    });

    context('emitting errors', function() {
      var ee;
      beforeEach(function() {
        ee = new events.EventEmitter();
        ee.on('error', function(err){
          err.should.have.property('data','data');
          err.should.be.an.instanceOf(LoggingMockError);
        });
      });
      it('#logAndEmitError creates an error', function(cb) {
        plan = new Plan(2, cb);
        ee.on('error', function(err){
          plan.ok(true);
        });

        logging.logAndEmitError(boundLogger,'logging test','loggingmock',
          {data: 'data'}, ee);
      });

      it('#logAndEmitWrapError creates an error', function(cb) {
        plan = new Plan(2, cb);
        var err = new Error();
        err.fear = 'beer';
        ee.on('error', function(err){
          err.should.have.property('fear','beer');
          err.should.have.property('stacktrace');
          plan.ok(true);
        });
        
        logging.logAndEmitWrapError(boundLogger, err, 'logging test','loggingmock',
          {data: 'data'}, ee);
      });
    });
  });

  context('emitted events', function() {
    it('#logEventEmitterErrors logs errors', function(cb) {
      boundLogger = {};
      boundLogger.error = function(message, data){
        message.should.equal('logging test');
        data.should.have.property('ctx');
        cb();
      };

      var ee = new events.EventEmitter();
      logging.logEventEmitterErrors(boundLogger,ee,{data: 'data'},'logging test');
      ee.emit('error', errs.create('loggingmock', {data:'data'}));
    });
  });
});