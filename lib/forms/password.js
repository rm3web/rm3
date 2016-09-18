var formlib = require('../formlib');
var validator = require('validator');

function PasswordForm() {
}

PasswordForm.prototype.checkForm = function(body, next) {
  var error = {};

  formlib.checkFieldsPresent(body, ['oldpassword', 'password1', 'password2'], error);
  if (body.password1 !== body.password2) {
    formlib.markError(error, '__all__', {error: 'passwords do not match'});
  }

  if (Object.keys(error).length === 0) {
    return next();
  }
  return next(error);
};

module.exports = PasswordForm;
