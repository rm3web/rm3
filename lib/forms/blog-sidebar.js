var formlib = require('../formlib');
var validator = require('validator');

function BlogSidebarForm(update) {
  this.update = update;
}

BlogSidebarForm.formToEntity = {
  title: 'summary.title',
  posting: 'data.posting',
  sidebar: 'data.sidebar',
  abstract: 'summary.abstract',
  excludeChildrenDisplay: 'data.excludeChildrenDisplay'
};

BlogSidebarForm.entityToForm = {
  'summary.title': 'title',
  'data.excludeChildrenDisplay': 'excludeChildrenDisplay'
};

BlogSidebarForm.prototype.checkForm = function(body, next) {
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

module.exports = BlogSidebarForm;
