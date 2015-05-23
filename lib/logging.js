var winston = require('winston'), 
    errs = require('errs'), 
    WinstonContext = require('winston-context');

exports.getRootLogger = function(system) {
  return new WinstonContext(winston, system, {
    system: system
  });
};

exports.logAndWrapError = function(boundLogger, message, errorName, data, next) {
  boundLogger.error(message,data);
  return next(errs.create(errorName, data));
};