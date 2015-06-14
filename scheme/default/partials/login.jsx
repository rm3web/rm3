var React = require('react');
var ReactIntl = require('react-intl');
var forms = require('newforms');
var IntlMixin  = ReactIntl.IntlMixin;
var FormattedMessage  = ReactIntl.FormattedMessage;
var LoginForm = require('../../../lib/forms/login.js')

var LoginFormComponent = React.createClass({
  mixins: [IntlMixin],
  render: function() {
    return (<form action="/$login/" method="post" onSubmit={this.onSubmit}>
      <forms.RenderForm form={LoginForm} ref="loginForm"/>
      <button> <FormattedMessage
                    message={this.getIntlMessage('SUBMIT')}  /></button>
    </form>);
  }
});

module.exports = LoginFormComponent;