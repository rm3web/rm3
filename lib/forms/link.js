var formlib = require('../formlib');
var validator = require('validator');

function LinkForm(update) {
  this.update = update;
}

LinkForm.formToEntity = {
  title: 'summary.title',
  abstract: 'summary.abstract',
  url: 'summary.url'
};

LinkForm.entityToForm = {
  'summary.title': 'title',
  'summary.abstract': 'abstract',
  'summary.url': 'url'
};

LinkForm.prototype.checkForm = function(body, next) {
  var error = {};

  formlib.checkFieldsPresent(body, ['title'], error);
  formlib.checkFieldsPresent(body, ['url'], error);

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

module.exports = LinkForm;
