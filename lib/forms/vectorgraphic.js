var formlib = require('../formlib');
var validator = require('validator');

function VectorGraphicForm(update) {
  this.update = update;
}

VectorGraphicForm.formToEntity = {
  title: 'summary.title',
  abstract: 'summary.abstract'
  block: 'data.posting'
};

VectorGraphicForm.entityToForm = {
  'summary.title': 'title',
};

VectorGraphicForm.prototype.checkForm = function(body, next) {
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

module.exports = VectorGraphicForm;
