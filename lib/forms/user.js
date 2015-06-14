var forms = require('newforms');
var i10n = require('../i10n');

var UserForm = forms.Form.extend({
  username: forms.CharField({required: true,
    widgetAttrs: {className: 'pure-input-1'},
    label:  i10n.formatMessage('USERNAME', {})}),
  fullname: forms.CharField({required: true,
    widgetAttrs: {className: 'pure-input-1'},
    label: i10n.formatMessage('FULL_NAME', {})}),
  password: forms.CharField({required: false,
    label: i10n.formatMessage('PASSWORD', {}),
    widgetAttrs: {className: 'pure-input-1'},
    widget: forms.PasswordInput}),
  confirmPassword: forms.CharField({required: false,
    label: i10n.formatMessage('CONFIRM_PASSWORD', {}),
    widgetAttrs: {className: 'pure-input-1'},
    widget: forms.PasswordInput}),
  profileUrl: forms.URLField({required: false,
    widgetAttrs: {className: 'pure-input-1'},
    label: i10n.formatMessage('PROFILE_URL', {})}),
  email: forms.EmailField({required: false,
    widgetAttrs: {className: 'pure-input-1'},
    label: i10n.formatMessage('EMAIL', {})}),
  profileText: forms.CharField({
    required: false,
    widgetAttrs: {className: 'pure-input-1'},
    label: i10n.formatMessage('PROFILE_TEXT', {}),
    widget: forms.Textarea}),
  clean: ['password', 'confirmPassword', function() {
    if (this.cleanedData.password &&
        this.cleanedData.confirmPassword &&
        this.cleanedData.password != this.cleanedData.confirmPassword) {
      throw forms.ValidationError('Passwords do not match.');
    }
  }]
});

exports.UserForm = UserForm;
