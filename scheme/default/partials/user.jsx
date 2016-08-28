var React = require('react');
var ReactIntl = require('react-intl');
var IntlProvider = ReactIntl.IntlProvider;
var FormattedMessage  = ReactIntl.FormattedMessage;
var UserForm = require('../../../lib/forms/user');
var JsxForms = require('rm3-react-controls');
var SingleError = JsxForms.SingleError;
var ErrorsList = JsxForms.ErrorsList;

var Username = ReactIntl.injectIntl(React.createClass({
  render: function() {
    if (this.props.section === 'edit') {
      return <input id="username" className="pure-input-1" type="text" name="username" value={this.props.username} disabled="true"/>
    } else {
      return <input id="username" className="pure-input-1" type="text" name="username" placeholder={this.props.intl.formatMessage({id:'USERNAME'})} defaultValue={this.props.username} />
    }
  }
}));

var UserFormComponent = ReactIntl.injectIntl(React.createClass({
  getInitialState: function() {
    if (this.props.errors) {
      return {errors: this.props.errors};
    } else {
      return {errors: {}};
    }
  },

  onSubmit: function (event) {
    var self = this;
    event.preventDefault();
    var userForm = new UserForm(this.props.section === 'edit');
    var body = {};
    ['username', 'fullname', 'email', 'password1', 'password2', 'disableLogin', 'profileUrl', 
    'profileText'].forEach(function(field) {
      var val = document.getElementById(field)
      if (val) {
        body[field] = val.value;
      }
    })
    userForm.checkForm(body, function(err) {
      if (err) {
        self.setState({errors: err});
      } else {
        document.forms["userform-form"].submit();
      }
    });
  },
  render: function() {
    var buttonMessage = 'submit';
    var self = this;

    if (this.props.section === 'edit') {
      buttonMessage = 'edit';
    }

    var body = {};
    if (this.props.body) {
      body = this.props.body;
      ['username', 'fullname', 'email', 'profileUrl', 'profileText', 'disableLogin'].forEach(function(field) {
        if (!self.props[field] && body.hasOwnProperty(field)) {
          self.props[field] = body[field];
        }
      });
    }

    return (
      <JsxForms.FormWrapper onSubmit={this.onSubmit} proto={this.props.proto} section={this.props.section}>
      <fieldset>
        <label htmlFor="username" className="pure-input-1"><FormattedMessage id={'LOGIN_ASCII_TEXT_NOSPACES'} />:</label>
        <Username section={this.props.section} username={this.props.username} />
        <ErrorsList errors={this.state.errors.username} />
      </fieldset>

      <fieldset>
        <label htmlFor="fullname" className="pure-input-1"><FormattedMessage id={'FULL_NAME'} />:</label>
        <input className="pure-input-1" id="fullname" type="text" name="fullname" placeholder={this.props.intl.formatMessage({id:'FULL_NAME'})} defaultValue={this.props.fullname} />
        <ErrorsList errors={this.state.errors.fullname} />
      </fieldset>

      <JsxForms.PasswordFieldSet display={this.props.section !== 'edit'} errors={this.state.errors} {...this.props} />

      <fieldset>
        <label htmlFor="disableLogin" className="pure-input-1">
        <input type="checkbox" id="disableLogin" name="disableLogin" value="true" defaultChecked={this.props.disableLogin} />
        <FormattedMessage id={'DISABLE_LOGIN'} />
        </label> 
        <ErrorsList errors={this.state.errors.disableLogin} />
      </fieldset>

      <fieldset>
        <label htmlFor="profileUrl" className="pure-input-1"><FormattedMessage id={'PROFILE_URL'} />:</label>
        <input className="pure-input-1" type="text" id="profileUrl" name="profileUrl" placeholder={this.props.intl.formatMessage({id:"URL"})} defaultValue={this.props.profileUrl} />
        <ErrorsList errors={this.state.errors.profileUrl} />
      </fieldset>

      <fieldset>
        <label htmlFor="email" className="pure-input-1"><FormattedMessage id={'EMAIL'} />:</label>
        <input className="pure-input-1" type="text" id="email" name="email" placeholder={this.props.intl.formatMessage({id:"EMAIL"})} defaultValue={this.props.email} />
        <ErrorsList errors={this.state.errors.email} />
      </fieldset>

      <fieldset>
        <label htmlFor="profileText" className="pure-input-1"><FormattedMessage id={'PROFILE_TEXT'} />:</label>
        <textarea defaultValue={this.props.profileText} rows="5" className="pure-input-1" id="profileText" name="profileText" placeholder={this.props.intl.formatMessage({id:"PROFILE_TEXT"})} >
        </textarea>
        <ErrorsList errors={this.state.errors.profileText} />
      </fieldset>

      <ErrorsList errors={this.state.errors.__all__} />
      <button type="submit">{buttonMessage}</button>
    </JsxForms.FormWrapper>);
  }
}));

var UserFormWrapper = function UserFormWrapper(props) {
  return <IntlProvider messages={props.messages} locale='en'><UserFormComponent {...props} /></IntlProvider>
};

module.exports = UserFormWrapper;