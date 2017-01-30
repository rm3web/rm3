var phase = require ('../../lib/phase');
var should = require('chai').should();
var Plan = require('test-plan');

describe('phase', function() {
  it('#addDefaultPhase should work', function(cb) {

    var plan = new Plan(2, cb);

    phase.addDefaultPhase('test1', function(app, next) {
      app.should.equal('foo');
      plan.ok(true);
      next();
    });

    phase.runPhase('test1', 'foo', function(err) {
      if (err) {
        should.fail();
      }
      plan.ok(true);
    });
  });

  it('#addToPhase should work', function(cb) {

    var plan = new Plan(3, cb);

    phase.addDefaultPhase('test2', function(app, next) {
      app.should.equal('goo');
      plan.ok(true);
      next();
    });

    phase.addToPhase('test2', function(app, next) {
      app.should.equal('goo');
      plan.ok(true);
      next();
    });

    phase.runPhase('test2', 'goo', function(err) {
      if (err) {
        should.fail();
      }
      plan.ok(true);
    });
  });

  it('#replaceAllInPhase should work', function(cb) {

    var plan = new Plan(2, cb);

    phase.addDefaultPhase('test3', function(app, next) {
      should.fail();
    });

    phase.addToPhase('test3', function(app, next) {
      should.fail();
    });

    phase.replaceAllInPhase('test3', function(app, next) {
      app.should.equal('moo');
      plan.ok(true);
      next();
    });

    phase.runPhase('test3', 'moo', function(err) {
      if (err) {
        should.fail();
      }
      plan.ok(true);
    });
  });
});
