var uuid = require('uuid');
var should = require('chai').should();
var runWorkflows = require('../../lib/runworkflows');
var workflow = require('../../lib/workflow');

require('mocha-steps');

describe('workflows', function() {
  this.timeout(8000); // This might take a bit of time
  before(function(cb) {
    runWorkflows(cb);
  });

  before(function(cb) {
    workflow.loadConf(cb);
  });

  after(function() {
    runWorkflows.killWorkflows();
    workflow.gunBackend();
  });

  var jobUuid;

  describe('works', function() {

    step('#setupWorkflows', function(done) {
      workflow.setupWorkflows(done);
    });

    step('#launchWorkflow', function(done) {
      workflow.launchWorkflow("dummy", {}, function(err, jobid) {
        if (err) {
          should.fail(err);
        }
        jobUuid = jobid;
        done(err);
      });
    });

    step('#waitForWorkflow #launchWorkflow', function(done) {
      workflow.waitForWorkflow(500, jobUuid, function(err, info) {
        if (err) {
          should.fail(err);
        }
        info.execution.should.equal('succeeded');
        info.chain_results[0].result.should.equal('dummy task ran');
        done(err);
      });
    });

    step('#scheduleWorkflow', function(done) {
      var now = new Date();
      var date = new Date(now.getTime() + 1000);
      workflow.scheduleWorkflow("dummy", date, {}, function(err, jobid) {
        if (err) {
          should.fail(err);
        }
        jobUuid = jobid;
        done(err);
      });
    });

    step('#waitForWorkflow #scheduleWorkflow', function(done) {
      workflow.waitForWorkflow(500, jobUuid, function(err, info) {
        if (err) {
          should.fail(err);
        }
        info.execution.should.equal('succeeded');
        info.chain_results[0].result.should.equal('dummy task ran');
        done(err);
      });
    });

    step('#deleteWorkflows', function(done) {
      workflow.deleteWorkflows(done);
    });
  });
});
