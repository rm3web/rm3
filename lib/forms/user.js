var validator = require('validator');

function markError(error, element, msg) {
  if (!error.hasOwnProperty(element)) {
    error[element] = [];
  }
  error[element].push(msg)
}

function checkFieldsPresent(body, fields, error) {
  fields.forEach(function(element, index, array) {
    if (validator.isNull(body[element])) {
      markError(error, element, {error: 'missing'});
    }
  })
}

function nullOrValid(body, element, valid, msg, error) {
  if (!validator.isNull(body[element])) {
    if (!valid(body[element])) {
      markError(error, element, msg)
    }
  }
}


function UserForm(update) {
  this.update = update;
}

UserForm.prototype.checkForm = function(body, next)
{
  var error = {};

  if (!this.update) {
    checkFieldsPresent(body, ['username', 'password1', 'password2'], error);
  }
  checkFieldsPresent(body, ['fullname'], error);
  if (body.password1 !== body.password2) {
    markError(error, '__all__', {error: 'passwords do not match'});
  }
  nullOrValid(body, 'profileUrl', validator.isURL, {error: 'invalid profile url'}, error);
  nullOrValid(body, 'email', validator.isEmail, {error: 'invalid email'}, error);

  next(error);
}

module.exports = UserForm;