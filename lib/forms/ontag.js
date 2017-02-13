var formlib = require('../formlib');
var validator = require('validator');

function OntagForm(update) {
  this.update = update;
}

OntagForm.formToEntity = {
  title: 'summary.title',
  abstract: 'summary.abstract',
  uri: 'summary.uri',
  properties: 'data.properties'
};

OntagForm.entityToForm = {
  'summary.title': 'title',
  'summary.uri': 'uri'
};

OntagForm.prototype.checkForm = function(body, next) {
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

module.exports = OntagForm;
