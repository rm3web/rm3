var uuid = require('uuid');
var should = require('chai').should();
var runWorkflows = require('../../lib/runworkflows');
var workflow = require('../../lib/workflow');
var workflowtasks = require('../../lib/workflowtasks');

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

    step('#addWorkflowDef', function() {
      var def = {
        name: 'dummy2',
        chain: [{
          name: 'Dummy task 2',
          timeout: 30,
          retry: 1,
          body: function(job, cb) {
            workflowtasks.withTempFile(job.params.ctx, 'abc', 'abcString', function(err, path, fd, cleanupCallback) {
              if (err) {
                cb(err);
              }
              cleanupCallback();
              workflowtasks.dangerousDoSpawn(job.params.ctx, 'true', 'true', [], function(err) {
                if (err) {
                  cb(err);
                }
                return cb(null, 'dummy task ran');
              });
            });
          }
        }],
        timeout: 180,
        onerror: []
      };
      workflow.addWorkflowDef('dummy2', def);
    });

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

    step('#launchWorkflow custom', function(done) {
      workflow.launchWorkflow("dummy2", {ctx: {}}, function(err, jobid) {
        if (err) {
          should.fail(err);
        }
        jobUuid = jobid;
        done(err);
      });
    });

    step('#waitForWorkflow #launchWorkflow custom', function(done) {
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
