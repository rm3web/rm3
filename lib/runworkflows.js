var Conf = require('./conf');
var WorkflowRunner = require('wf').Runner;
var winston = require('winston');
var path = require('path');
var runner;

// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
var config = {
  backend: {
    module: "wf-pg-backend",
    opts: Conf.getEndpoint('workflowPostgres')
  },
  runner: {
    identifier: "cd925eef-93fb-4bfe-a820-2aaedf9fc006",
    forks: 1,
    do_fork: false,
    run_interval: 250,
    activity_interval: 500,
    sandbox: {
      /*
      "modules": {
        "workflowlib": path.join(__dirname, '../lib/workflowdefs/index.js')
      }*/
    }
  }
};
// jscs:enable

function runWorkflows(next) {
  runner = WorkflowRunner(config);
  runner.init(function(err) {
    if (err) {
      winston.error('Error initializing runner:', err);
    }
    runner.run();
    winston.info('workflow', 'Workflow Runner up!');
    next(err);
  });

  process.on('SIGINT', function() {
    winston.info('Got SIGINT. Stopping workflow');
    runner.quit(function() {
      winston.info('Workflow stopped.');
      process.exit(0);
    });
  });

  process.on('SIGTERM', function() {
    winston.info('Got SIGTERM. Stopping workflow');
    runner.kill(function() {
      winston.info('Workflow stopped.');
      process.exit(0);
    });
  });
}

function killWorkflows() {
  runner.kill(function() {
  });
}

runWorkflows.killWorkflows = killWorkflows;

exports = module.exports = runWorkflows;
