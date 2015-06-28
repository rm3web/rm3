var React = require('react');
var ReactIntl = require('react-intl');
var IntlMixin  = ReactIntl.IntlMixin;
var FormattedMessage  = ReactIntl.FormattedMessage;

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

var SingleError = React.createClass({
  render: function() {
    return (<li>
      {this.props.error}
      </li>);
  }
});

var ErrorsList = React.createClass({
  mixins: [IntlMixin],
  render: function() {
    if (this.props.errors) {
      return (<div><ul>
      {this.props.errors.map(function(error, i){
          return (<SingleError key={i} error={error} />);
      })}
      </ul></div>);
    } else {
      return <div />
    }
  }
});

var UserFormComponent = React.createClass({
  mixins: [IntlMixin],
  render: function() {
    var buttonMessage = 'submit';
    var action = 'create.html?type=' + this.props.proto;
    var self = this;

    if (this.props.section === 'edit') {
      buttonMessage = 'edit';
      action = 'edit.html'
    }

    var errors = {};
    if (this.props.errors) {
      errors = this.props.errors;
    }
    var body = {};
    if (this.props.body) {
      body = this.props.body;
      ['username', 'fullname', 'email', 'profileUrl', 'abstract'].forEach(function(field) {
        if (!self.props[field] && body.hasOwnProperty(field)) {
          self.props[field] = body[field];
        }
      });
    }

    return (<form action={action} id="userform-form" method="post" className="pure-form pure-form-stacked" onSubmit={this.onSubmit}>
      <fieldset>
        <label htmlFor="username" className="pure-input-1"><FormattedMessage message={this.getIntlMessage('LOGIN_ASCII_TEXT_NOSPACES')} />:</label>
        <Username section={this.props.section} username={this.props.username} />
        <ErrorsList errors={errors.username} />
      </fieldset>

      <fieldset>
        <label htmlFor="fullname" className="pure-input-1"><FormattedMessage message={this.getIntlMessage('FULL_NAME')} />:</label>
        <input className="pure-input-1" type="text" name="fullname" placeholder={this.getIntlMessage('FULL_NAME')} defaultValue={this.props.fullname} />
        <ErrorsList errors={errors.fullname} />
      </fieldset>

      <fieldset>
        <label htmlFor="password" className="pure-input-1"><FormattedMessage message={this.getIntlMessage('PASSWORD_ENTER_TWICE')} />:</label>
        <input className="pure-input-1" type="password" defaultValue="" name="password1" placeholder={this.getIntlMessage('PASSWORD')} />
        <ErrorsList errors={errors.password1} />
        <input className="pure-input-1" type="password" defaultValue="" name="password2" placeholder={this.getIntlMessage('CONFIRM_PASSWORD')} />
        <ErrorsList errors={errors.password2} />
      </fieldset>

      <fieldset>
        <label htmlFor="profileUrl" className="pure-input-1"><FormattedMessage message={this.getIntlMessage('PROFILE_URL')} />:</label>
        <input className="pure-input-1" type="text" id="profileUrl" name="profileUrl" placeholder={this.getIntlMessage("URL")} defaultValue={this.props.profileUrl} />
        <ErrorsList errors={errors.profileUrl} />
      </fieldset>

      <fieldset>
        <label htmlFor="email" className="pure-input-1"><FormattedMessage message={this.getIntlMessage('EMAIL')} />:</label>
        <input className="pure-input-1" type="text" id="email" name="email" placeholder={this.getIntlMessage("EMAIL")} defaultValue={this.props.email} />
        <ErrorsList errors={errors.email} />
      </fieldset>

      <fieldset>
        <label htmlFor="abstract" className="pure-input-1"><FormattedMessage message={this.getIntlMessage('PROFILE_TEXT')} />:</label>
        <textarea defaultValue={this.props.profileText} rows="5" className="pure-input-1" name="abstract" placeholder={this.getIntlMessage("PROFILE_TEXT")} >
        </textarea>
        <ErrorsList errors={errors.profileText} />
      </fieldset>

      <ErrorsList errors={errors.__all__} />
      <button> <FormattedMessage
                    message={buttonMessage} /></button>
    </form>);
  }
});

module.exports = UserFormComponent;