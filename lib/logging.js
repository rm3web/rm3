var winston = require('winston'),
    errs = require('errs'),
    WinstonContext = require('winston-context');
/**
* @overview A bunch of logging wrappers to make it a bit more natural to always
* make sure that all errors are logged.
* @title Logging
* @module logging
*/

/**
 * Fetch the root Winston logger.
 * @param {string} system The subsystem to log under.
 * @return {Object} new Winston logger
 */
exports.getRootLogger = function(system) {
  return new WinstonContext(winston, system, {
    system: system
  });
};

/**
 * Create an error `errorName` via errs with `data`, and then also log it
 * as an error via a supplied `boundLogger`, then finally call `next`.
 *
 * @param {Object} boundLogger The bound logger to log to
 * @param {string} message The message to log
 * @param {string} errorName The error name to look up via errs.
 * @param {Object} data The error data
 * @param {Function} next The next function to call with an error
 */
exports.logAndCreateError = function(boundLogger, message, errorName, data, next) {
  boundLogger.error(message, data);
  next(errs.create(errorName, data));
};

/**
 * Wrap `err` in a new error `errorName via errs with `data`, and
 * then also log it as an error via a supplied `boundLogger`.
 *
 * @param {Object} boundLogger The bound logger to log to
 * @param {Error} err The error to wrap
 * @param {string} message The message to log
 * @param {string} errorName The error name to look up via errs.
 * @param {Object} data The error data
 */
exports.logAndIgnoreError = function(boundLogger, err, message, errorName, data) {
  var wrappedError = errs.merge(err, errorName, data);
  boundLogger.error(message, data);
};

/**
 * Wrap `err` in a new error `errorName via errs with `data`, and
 * then also log it as an error via a supplied `boundLogger`, then
 * finally call `next`.
 *
 * @param {Object} boundLogger The bound logger to log to
 * @param {Error} err The error to wrap
 * @param {string} message The message to log
 * @param {string} errorName The error name to look up via errs.
 * @param {Object} data The error data
 * @param {Function} next The next function to call with an error
 */
exports.logAndWrapError = function(boundLogger, err, message, errorName, data, next) {
  var wrappedError = errs.merge(err, errorName, data);
  boundLogger.error(message, data);
  next(wrappedError);
};

/**
 * Create an error `errorName` via errs with `data`, and then also log it
 * as an error via a supplied `boundLogger`, then finally emit it via `ee`
 * as an `error`
 *
 * @param {Object} boundLogger The bound logger to log to
 * @param {string} message The message to log
 * @param {string} errorName The error name to look up via errs.
 * @param {Object} data The error data
 * @param {EventEmitter} ee The event emitter to emit to
 */
exports.logAndEmitError = function(boundLogger, message, errorName, data, ee) {
  boundLogger.error(message, data);
  ee.emit('error', errs.create(errorName, data));
};

/**
 * Wrap `err` in a new error `errorName via errs with `data`, and
 * then also log it as an error via a supplied `boundLogger`, then
 * finally emit it via `ee` as an `error`
 *
 * @param {Object} boundLogger The bound logger to log to
 * @param {Error} err The error to wrap
 * @param {string} message The message to log
 * @param {string} errorName The error name to look up via errs.
 * @param {Object} data The error data
 * @param {EventEmitter} ee The event emitter to emit to
 */
exports.logAndEmitWrapError = function(boundLogger, err, message, errorName, data, ee) {
  var wrappedError = errs.merge(err, errorName, data);
  boundLogger.error(message, data);
  ee.emit('error', wrappedError);
};

/**
 * Log any errors emitted by the EventEmitter to `boundLogger`
 *
 * @param {Object} boundLogger The bound logger to log to
 * @param {EventEmitter} ee The event emitter that is emitting errors
 * @param {Object} ctx The context to log
 * @param {string} message The message to log
 */
exports.logEventEmitterErrors = function(boundLogger, ee, ctx, message) {
  ee.on("error", function(err) {
    if (err.stack) {
      console.log(err.stack);
    }
    boundLogger.error(message, {
      ctx: ctx,
      err: err
    });
  });
};
