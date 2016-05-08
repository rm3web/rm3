var Conf = require('./conf');
var workflows = require('./workflowdefs');
var Factory = require('wf').Factory;
var Backend = Conf.getDriver('wf');
var config, backend, factory;
var path = require('path');
var fs = require('fs');
var errs = require('errs');
var util = require('util');
var async = require('async');

var logging = require('./logging');

var boundLogger = logging.getRootLogger('workflow');

function WorkflowError() {
}
util.inherits(WorkflowError, Error);

errs.register('workflow', WorkflowError);

exports.loadConf = function loadConf(next) {
  backend = new Backend(Conf.getEndpoint('workflowPostgres'));
  backend.init(function(err) {
    if (err) {
      boundLogger.error('workflow startup failed' , err);
    }
    factory = Factory(backend);
    next(err);
  });
};

exports.gunBackend = function gunBackend() {
  if (backend) {
    backend.quit(function(err) {
    });
  }
};

exports.setupWorkflow = function setupWorkflow(wfName, next) {
  factory.workflow(workflows[wfName], function(err, wf) {
    if (err) {
      boundLogger.error('workflow setup failed' , err);
    }
    next(err);
  });
};

exports.setupWorkflows = function setupWorkflow(next) {
  async.forEachOf(workflows, function(item, key, callback) {
    exports.setupWorkflow(key, callback);
  }, next);
};

exports.deleteWorkflow = function deleteWorkflow(wfName, next) {
  backend.getWorkflows({name: wfName}, function(err, workflows) {
    backend.deleteWorkflow(workflows[0], function(err, res) {
      if (err) {
        boundLogger.error('workflow setup failed' , err);
      }
      next(err);
    });
  });
};

exports.deleteWorkflows = function setupWorkflow(next) {
  async.forEachOf(workflows, function(item, key, callback) {
    exports.deleteWorkflow(key, callback);
  }, next);
};

exports.launchWorkflow = function launchWorkflow(wfName, params, next) {
  backend.getWorkflows({name: wfName}, function(err, workflows) {
    if (workflows.length === 0) {
      return logging.logAndCreateError(boundLogger,
        'launchWorkflow can\'t find workflow', 'workflow', {
          wfName: wfName
        }, next);
    }
    var wf = workflows[0];
    var aJob = {
      workflow: wf.uuid,
      params: params
    };
    factory.job(aJob, function(err, job) {
      if (err) {
        return logging.logAndCreateError(boundLogger,
          'launchWorkflow', 'workflow', {
            underlying: err
          }, next);
      }
      if (job.execution !== 'queued') {
        return logging.logAndCreateError(boundLogger,
          'launchWorkflow not queued', 'workflow', {
            underlying: err
          }, next);
      }
      next(err, job.uuid);
    });
  });
};

exports.scheduleWorkflow = function launchWorkflow(wfName, date, params, next) {
  backend.getWorkflows({name: wfName}, function(err, workflows) {
    var wf = workflows[0];
    /* eslint-disable camelcase */
    var aJob = {
      workflow: wf.uuid,
      exec_after: date,
      params: params
    };
    /* eslint-enable camelcase */
    factory.job(aJob, function(err, job) {
      if (err) {
        return logging.logAndCreateError(boundLogger,
          'scheduleWorkflow', 'workflow', {
            underlying: err
          }, next);
      }
      if (job.execution !== 'queued') {
        return logging.logAndCreateError(boundLogger,
          'scheduleWorkflow not queued', 'workflow', {
            underlying: err
          }, next);
      }
      next(err, job.uuid);
    });
  });
};

exports.waitForWorkflow = function waitForWorkflow(interval, jobuuid, next) {
  var intervalId = setInterval(function() {
    backend.getJob(jobuuid, function(err, obj) {
      if (err) {
        return logging.logAndCreateError(boundLogger,
          'waitForWorkflow', 'workflow', {
            underlying: err
          }, next);
      }
      if (obj.execution === 'failed') {
        return logging.logAndCreateError(boundLogger,
          'scheduleWorkflow failed', 'workflow', {
            obj: obj
          }, next);
      }
      if (obj.execution === 'succeeded') {
        clearInterval(intervalId);
        next(err, obj);
      }
    });
  }, interval);
};
