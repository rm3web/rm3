var formlib = require('../formlib');
var validator = require('validator');

function UserForm(update) {
  this.update = update;
}

UserForm.prototype.checkForm = function(body, next) {
  var error = {};

  if (!this.update) {
    formlib.checkFieldsPresent(body, ['username', 'password1', 'password2'], error);
  }
  formlib.checkFieldsPresent(body, ['fullname'], error);
  if (body.password1 !== body.password2) {
    formlib.markError(error, '__all__', {error: 'passwords do not match'});
  }
  formlib.nullOrValid(body, 'profileUrl', validator.isURL, {error: 'invalid profile url'}, error);
  formlib.nullOrValid(body, 'email', validator.isEmail, {error: 'invalid email'}, error);

  if (Object.keys(error).length === 0) {
    return next();
  }
  return next(error);
};

module.exports = UserForm;
