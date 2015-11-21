var phase = require ('../../lib/phase');
var should = require('should');
var Plan = require('test-plan');

describe('phase', function() {
  it('#addDefaultPhase should work', function(cb) {

    var plan = new Plan(2, cb);

    phase.addDefaultPhase('test', function(next) {
      plan.ok(true);
      next();
    });

    phase.runPhase('test', function(err) {
      if (err) {
        should.fail();
      }
      plan.ok(true);
    });
  });

  it('#addToPhase should work', function(cb) {

    var plan = new Plan(3, cb);

    phase.addDefaultPhase('test', function(next) {
      plan.ok(true);
      next();
    });

    phase.addToPhase('test', function(next) {
      plan.ok(true);
      next();
    });

    phase.runPhase('test', function(err) {
      if (err) {
        should.fail();
      }
      plan.ok(true);
    });
  });

  it('#replaceAllInPhase should work', function(cb) {

    var plan = new Plan(2, cb);

    phase.addDefaultPhase('test', function(next) {
      should.fail();
    });

    phase.addToPhase('test', function(next) {
      should.fail();
    });

    phase.replaceAllInPhase('test', function(next) {
      plan.ok(true);
      next();
    });

    phase.runPhase('test', function(err) {
      if (err) {
        should.fail();
      }
      plan.ok(true);
    });
  });
});
