var formlib = require('../formlib');
var validator = require('validator');

function PhotoForm(update) {
  this.update = update;
}

PhotoForm.formToEntity = {
  title: 'summary.title',
  abstract: 'summary.abstract',
  block: 'data.posting'
};

PhotoForm.entityToForm = {
  'summary.title': 'title'
};

PhotoForm.prototype.checkForm = function(body, next) {
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

module.exports = PhotoForm;
