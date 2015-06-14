var React = require('react');
var ReactIntl = require('react-intl');
var forms = require('newforms');
var IntlMixin  = ReactIntl.IntlMixin;
var FormattedMessage  = ReactIntl.FormattedMessage;
var forms = require('newforms');
var i10n = require('../../../lib/i10n');

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
    widget: forms.Textarea})
});

var Username =  React.createClass({
  render: function() {
    if (this.props.section === 'edit') {
      return <span>Username: {this.props.username}</span>
    } else {
      return <span>Create </span>
    }
  }
});

var LoginFormComponent = React.createClass({
  mixins: [IntlMixin],
  getInitialState: function() {
    return {
      username: this.props.username,
      fullname: this.props.fullname,
      profileUrl: this.props.profileUrl,
      email: this.props.email,
      profileText: this.props.profileText
    }
  },
  render: function() {
    var buttonMessage = 'submit';
    var action = 'create.html?type={meta.proto}'

    var form = new UserForm();

    if (this.props.section === 'edit') {
      delete form.fields.username;
      buttonMessage = 'edit';
      action = 'edit.html'
    }

    return (<form action={action} method="post" className="pure-form pure-form-stacked" onSubmit={this.onSubmit}>
      <Username section={this.props.section} username={this.props.username} />
      <forms.RenderForm form={form} />
      <button> <FormattedMessage
                    message={buttonMessage} /></button>
    </form>);
  },
  clean: function() {
    if (this.cleanedData.password &&
        this.cleanedData.confirmPassword &&
        this.cleanedData.password != this.cleanedData.confirmPassword) {
      throw forms.ValidationError('Passwords do not match.')
    }
  }
});

module.exports = LoginFormComponent;