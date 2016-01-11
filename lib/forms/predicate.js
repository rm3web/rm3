var formlib = require('../formlib');
var validator = require('validator');

function PredicateForm(update) {
  this.update = update;
}

PredicateForm.prototype.checkForm = function(body, next) {
  var error = {};

  formlib.checkFieldsPresent(body, ['title'], error);

  if (!this.update) {
    if (!validator.toBoolean(body.autogenSlug)) {
      if (validator.isNull(body.leaf)) {
        formlib.markError(error, 'leaf', {error: 'Slug is empty'});
      }
    }
  }

  if (Object.keys(error).length === 0) {
    return next();
  }
  return next(error);
};

module.exports = PredicateForm;
