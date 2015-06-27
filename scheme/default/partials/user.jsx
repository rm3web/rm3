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
      return <input id="username" className="pure-input-1" type="text" name="username" placeholder={this.getIntlMessage('USERNAME')} value={this.props.username} />
    }
  }
});

var UserFormComponent = React.createClass({
  mixins: [IntlMixin],
  render: function() {
    var buttonMessage = 'submit';
    var action = 'create.html?type=' + this.props.proto;

    if (this.props.section === 'edit') {
      buttonMessage = 'edit';
      action = 'edit.html'
    }

    return (<form action={action} id="userform-form" method="post" className="pure-form pure-form-stacked" onSubmit={this.onSubmit}>
      <fieldset>
        <label htmlFor="username" className="pure-input-1"><FormattedMessage message={this.getIntlMessage('LOGIN_ASCII_TEXT_NOSPACES')} />:</label>
        <Username section={this.props.section} username={this.props.username} />
      </fieldset>

      <fieldset>
        <label htmlFor="fullname" className="pure-input-1"><FormattedMessage message={this.getIntlMessage('FULL_NAME')} />:</label>
        <input className="pure-input-1" type="text" name="fullname" placeholder={this.getIntlMessage('FULL_NAME')} value={this.props.fullname} />
      </fieldset>

      <fieldset>
        <label htmlFor="password" className="pure-input-1"><FormattedMessage message={this.getIntlMessage('PASSWORD_ENTER_TWICE')} />:</label>
        <input className="pure-input-1" type="password" value="" name="password1" placeholder={this.getIntlMessage('PASSWORD')} />
        <input className="pure-input-1" type="password" value="" name="password2" placeholder={this.getIntlMessage('CONFIRM_PASSWORD')} />
      </fieldset>

      <fieldset>
        <label htmlFor="profile_url" className="pure-input-1"><FormattedMessage message={this.getIntlMessage('PROFILE_URL')} />:</label>
        <input className="pure-input-1" type="text" id="profileUrl" name="profileUrl" placeholder={this.getIntlMessage("URL")} value={this.props.profileUrl} />
      </fieldset>

      <fieldset>
        <label htmlFor="email" className="pure-input-1"><FormattedMessage message={this.getIntlMessage('EMAIL')} />:</label>
        <input className="pure-input-1" type="text" id="email" name="email" placeholder={this.getIntlMessage("EMAIL")} value={this.props.email} />
      </fieldset>

      <fieldset>
        <label htmlFor="Profile text" className="pure-input-1"><FormattedMessage message={this.getIntlMessage('PROFILE_TEXT')} />:</label>
        <textarea rows="5" className="pure-input-1" name="abstract" placeholder={this.getIntlMessage("PROFILE_TEXT")} >
        {this.props.profileText}
        </textarea>
      </fieldset>

      <button> <FormattedMessage
                    message={buttonMessage} /></button>
    </form>);
  }
});

module.exports = UserFormComponent;