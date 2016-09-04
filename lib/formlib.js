var validator = require('validator');
var dotty = require("dotty");
/**
* @overview A little bit of form error-handling utilities
* @title FormLib
* @module formlib
*/

/**
 * Mark an error in the `error` data structure
 *
 * @param {*} error The error data structure
 * @param {string} element The element to mark an error on
 * @param {string} msg The error message
 */
exports.markError = function markError(error, element, msg) {
  if (!error.hasOwnProperty(element)) {
    error[element] = [];
  }
  error[element].push(msg);
};

/**
 * Check to see if the fields listed in `fields` are present in `body` and
 * create errors.
 *
 * @param {Object} body The object we're checking
 * @param {Array} fields The fields we're looking for
 * @param {*} error The error data structure
 */
exports.checkFieldsPresent = function checkFieldsPresent(body, fields, error) {
  fields.forEach(function(element, index, array) {
    if (validator.isNull(body[element])) {
      exports.markError(error, element, {error: 'missing'});
    }
  });
};

/**
 * If `element` in `body` is null, that's OK.  Otherwise, check it using `valid`
 *
 * @param {Object} body The object we're checking
 * @param {string} element The element we're checking
 * @param {Function} valid The validator function
 * @param {string} msg The error message
 * @param {*} error The error data structure
 */
exports.nullOrValid = function nullOrValid(body, element, valid, msg, error) {
  if (!validator.isNull(body[element])) {
    if (!valid(body[element])) {
      exports.markError(error, element, msg);
    }
  }
};

exports.copyViaDottedPath = function copyViaDots(dest, source, map) {
  for (var key in map) {
    if (map.hasOwnProperty(key)) {
      dotty.put(dest, key, dotty.get(source, map[key]));
    }
  }
};
