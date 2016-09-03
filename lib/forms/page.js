var formlib = require('../formlib');
var validator = require('validator');

function PageForm(update) {
  this.update = update;
}

PageForm.formToEntity = {
  title: 'summary.title',
  abstract: 'summary.abstract',
  block: 'data.posting',
  excludeChildrenDisplay: 'data.excludeChildrenDisplay'
};

PageForm.entityToForm = {
  'summary.title': 'title',
  'summary.abstract': 'abstract',
  'data.excludeChildrenDisplay': 'excludeChildrenDisplay'
};

PageForm.prototype.checkForm = function(body, next) {
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

module.exports = PageForm;
