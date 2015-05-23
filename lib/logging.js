var winston = require('winston'), 
    errs = require('errs'), 
    WinstonContext = require('winston-context');

exports.getRootLogger = function(system) {
  return new WinstonContext(winston, system, {
    system: system
  });
};

exports.logAndCreateError = function(boundLogger, message, errorName, data, next) {
  boundLogger.error(message,data);
  return next(errs.create(errorName, data));
};

exports.logAndWrapError = function(boundLogger, err, message, errorName, data, next) {
  var wrappedError = errs.merge(err, errorName, data);
  boundLogger.error(message,data);
  return next(wrappedError);
};

exports.logAndEmitError = function(boundLogger, message, errorName, data, ee) {
  boundLogger.error(message,data);
  ee.emit('error', errs.create(errorName, data));
};

exports.logAndEmitWrapError = function(boundLogger, err, message, errorName, data, ee) {
  var wrappedError = errs.merge(err, errorName, data);
  boundLogger.error(message,data);
  ee.emit('error', wrappedError);
};