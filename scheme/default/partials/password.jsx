var React = require('react');
var ReactIntl = require('react-intl');
var IntlProvider = ReactIntl.IntlProvider;
var FormattedMessage  = ReactIntl.FormattedMessage;
var JsxForms = require('rm3-react-controls');
var SingleError = JsxForms.SingleError;
var ErrorsList = JsxForms.ErrorsList;

var PasswordFormComponent = ReactIntl.injectIntl(React.createClass({
  getInitialState: function() {
    if (this.props.errors) {
      return {errors: this.props.errors};
    } else {
      return {errors: {}};
    }
  },

  render: function() {
    var self = this;

    return (<form id="password-form" method="post" action="./password.html" className="pure-form pure-form-stacked">
      <fieldset>
        <label htmlFor="oldpassword" className="pure-input-1"><FormattedMessage id={'CURRENT_PASSWORD'} />:</label>
        <input className="pure-input-1" id="oldpassword" type="password" name="oldpassword" placeholder={this.props.intl.formatMessage({id:'CURRENT_PASSWORD'})} />
        <ErrorsList errors={this.state.errors.fullname} />
      </fieldset>

      <JsxForms.PasswordFieldSet display={this.props.section !== 'edit'} errors={this.state.errors} />

      <ErrorsList errors={this.state.errors.__all__} />
      <button type="submit">Change Password</button>
    </form>);
  }
}));

var PasswordFormWrapper = function PasswordFormWrapper(props) {
  return <IntlProvider messages={props.messages} locale='en'><PasswordFormComponent {...props} /></IntlProvider>
};

module.exports = PasswordFormWrapper;