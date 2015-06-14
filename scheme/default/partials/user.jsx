var React = require('react');
var ReactIntl = require('react-intl');
var forms = require('newforms');
var IntlMixin  = ReactIntl.IntlMixin;
var FormattedMessage  = ReactIntl.FormattedMessage;
var forms = require('newforms');
var i10n = require('../../../lib/i10n');
var UserForm = require('../../../lib/forms/user.js').UserForm;

var Username =  React.createClass({
  render: function() {
    if (this.props.section === 'edit') {
      return <span>Username: <span id="userform-username">{this.props.username}</span> </span>
    } else {
      return <span></span>
    }
  }
});

var UserFormComponent = React.createClass({
  mixins: [IntlMixin],
  render: function() {
    var buttonMessage = 'submit';
    var action = 'create.html?type=' + this.props.proto;
    var data;

    if (this.props.hasOwnProperty('fullname')) {
      data = {data: {
        username: this.props.username,
        fullname: this.props.fullname,
        profileUrl: this.props.profileUrl,
        email: this.props.email,
        profileText: this.props.profileText
      }}
    }

    var form = new UserForm(data);
    var username;

    if (this.props.section === 'edit') {
      if (!this.props.hasOwnProperty('username') && form.isInitialRender) {
        form.validate(document.getElementById('userform-form'));
        username = document.getElementById('userform-username').innerHTML;
      } else {
        username = this.props.username;
      }
      delete form.fields.username;
      buttonMessage = 'edit';
      action = 'edit.html'
    } else {
      form.fields.password.required = true;
      form.fields.confirmPassword.required = true;
    }

    return (<form action={action} id="userform-form" method="post" className="pure-form pure-form-stacked" onSubmit={this.onSubmit}>
      <Username section={this.props.section} username={username} />
      <forms.RenderForm form={form} />
      <button> <FormattedMessage
                    message={buttonMessage} /></button>
    </form>);
  }
});

module.exports = UserFormComponent;