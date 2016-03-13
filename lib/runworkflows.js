var Conf = require('./conf');
var WorkflowRunner = require('wf').Runner;
var bunyanToWinstonAdapter = require('bunyan-winston-adapter');
var winston = require('winston');

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
      "modules": {
        "workflowlib": "./lib/workflowdefs"
      }
    }
  },
  logger: bunyanToWinstonAdapter.createAdapter(winston)
};
// jscs:enable

function runWorkflows() {
  var runner = WorkflowRunner(config);
  runner.init(function(err) {
    if (err) {
      winston.error('Error initializing runner:', err);
      process.exit(1);
    }
    runner.run();
    winston.info('workflow', 'Workflow Runner up!');
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

exports = module.exports = runWorkflows;
