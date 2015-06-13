var forms = require('newforms');
var i10n = require('../i10n');

var LoginForm = forms.Form.extend({
  username: forms.CharField({required: true,
   label:  i10n.formatMessage('USERNAME',{})}),
  password: forms.CharField({widget: forms.PasswordInput, required: true, 
    label:  i10n.formatMessage('PASSWORD',{})}),
});

module.exports = LoginForm;