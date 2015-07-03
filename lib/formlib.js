var validator = require('validator');

exports.markError = function markError(error, element, msg) {
  if (!error.hasOwnProperty(element)) {
    error[element] = [];
  }
  error[element].push(msg);
};

exports.checkFieldsPresent = function checkFieldsPresent(body, fields, error) {
  fields.forEach(function(element, index, array) {
    if (validator.isNull(body[element])) {
      exports.markError(error, element, {error: 'missing'});
    }
  });
};

exports.nullOrValid = function nullOrValid(body, element, valid, msg, error) {
  if (!validator.isNull(body[element])) {
    if (!valid(body[element])) {
      exports.markError(error, element, msg);
    }
  }
};
