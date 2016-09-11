var formlib = require('../formlib');
var validator = require('validator');

function EmailForm(update) {
  this.update = update;
}

EmailForm.formToEntity = {
  title: 'summary.title',
  address: 'data.address',
  description: 'data.description',
  abstract: 'summary.abstract'
};

EmailForm.entityToForm = {
  'summary.title': 'title',
  'data.address': 'address',
  'data.description': 'description'
};

EmailForm.prototype.checkForm = function(body, next) {
  var error = {};

  formlib.checkFieldsPresent(body, ['title'], error);
  formlib.checkFieldsPresent(body, ['address'], error);

  if (!validator.isEmail(body.address)) {
    formlib.markError(error, 'address', {error: 'Not an email address'});
  }

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

module.exports = EmailForm;
