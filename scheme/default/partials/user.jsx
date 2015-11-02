var React = require('react');
var ReactIntl = require('react-intl');
var IntlMixin  = ReactIntl.IntlMixin;
var FormattedMessage  = ReactIntl.FormattedMessage;
var UserForm = require('../../../lib/forms/user');
var JsxForms = require('../../../lib/jsx_forms.jsx');
var SingleError = JsxForms.SingleError;
var ErrorsList = JsxForms.ErrorsList;

var Username =  React.createClass({
  mixins: [IntlMixin],
  render: function() {
    if (this.props.section === 'edit') {
      return <input id="username" className="pure-input-1" type="text" name="username" value={this.props.username} disabled="true"/>
    } else {
      return <input id="username" className="pure-input-1" type="text" name="username" placeholder={this.getIntlMessage('USERNAME')} defaultValue={this.props.username} />
    }
  }
});


var UserFormComponent = React.createClass({
  mixins: [IntlMixin],

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
    var action = 'create.html?type=' + this.props.proto;
    var self = this;

    if (this.props.section === 'edit') {
      buttonMessage = 'edit';
      action = 'edit.html'
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

    return (<form action={action} id="userform-form" method="post" className="pure-form pure-form-stacked" onSubmit={this.onSubmit}>
      <fieldset>
        <label htmlFor="username" className="pure-input-1"><FormattedMessage message={this.getIntlMessage('LOGIN_ASCII_TEXT_NOSPACES')} />:</label>
        <Username section={this.props.section} username={this.props.username} />
        <ErrorsList errors={this.state.errors.username} />
      </fieldset>

      <fieldset>
        <label htmlFor="fullname" className="pure-input-1"><FormattedMessage message={this.getIntlMessage('FULL_NAME')} />:</label>
        <input className="pure-input-1" id="fullname" type="text" name="fullname" placeholder={this.getIntlMessage('FULL_NAME')} defaultValue={this.props.fullname} />
        <ErrorsList errors={this.state.errors.fullname} />
      </fieldset>

      <fieldset>
        <label htmlFor="password" className="pure-input-1"><FormattedMessage message={this.getIntlMessage('PASSWORD_ENTER_TWICE')} />:</label>
        <input className="pure-input-1" type="password" defaultValue="" id="password1" name="password1" placeholder={this.getIntlMessage('PASSWORD')} />
        <ErrorsList errors={this.state.errors.password1} />
        <input className="pure-input-1" type="password" defaultValue="" id="password2" name="password2" placeholder={this.getIntlMessage('CONFIRM_PASSWORD')} />
        <ErrorsList errors={this.state.errors.password2} />
      </fieldset>

      <fieldset>
        <label htmlFor="disableLogin" className="pure-input-1">
        <input type="checkbox" id="disableLogin" name="disableLogin" value="true" defaultChecked={this.props.disableLogin} />
        <FormattedMessage message={this.getIntlMessage('DISABLE_LOGIN')} />
        </label> 
        <ErrorsList errors={this.state.errors.disableLogin} />
      </fieldset>

      <fieldset>
        <label htmlFor="profileUrl" className="pure-input-1"><FormattedMessage message={this.getIntlMessage('PROFILE_URL')} />:
        <input className="pure-input-1" type="text" id="profileUrl" name="profileUrl" placeholder={this.getIntlMessage("URL")} defaultValue={this.props.profileUrl} /></label>
        <ErrorsList errors={this.state.errors.profileUrl} />
      </fieldset>

      <fieldset>
        <label htmlFor="email" className="pure-input-1"><FormattedMessage message={this.getIntlMessage('EMAIL')} />:</label>
        <input className="pure-input-1" type="text" id="email" name="email" placeholder={this.getIntlMessage("EMAIL")} defaultValue={this.props.email} />
        <ErrorsList errors={this.state.errors.email} />
      </fieldset>

      <fieldset>
        <label htmlFor="profileText" className="pure-input-1"><FormattedMessage message={this.getIntlMessage('PROFILE_TEXT')} />:</label>
        <textarea defaultValue={this.props.profileText} rows="5" className="pure-input-1" id="profileText" name="profileText" placeholder={this.getIntlMessage("PROFILE_TEXT")} >
        </textarea>
        <ErrorsList errors={this.state.errors.profileText} />
      </fieldset>

      <ErrorsList errors={this.state.errors.__all__} />
      <button type="submit"><FormattedMessage message={buttonMessage} /></button>
    </form>);
  }
});

module.exports = UserFormComponent;