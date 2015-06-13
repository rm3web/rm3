var React = require('react');
var ReactIntl = require('react-intl');
var forms = require('newforms');
var i10n = require('../../../lib/i10n');
var IntlMixin  = ReactIntl.IntlMixin;
var FormattedMessage  = ReactIntl.FormattedMessage;

var LoginForm = forms.Form.extend({
  username: forms.CharField({required: true,
   label:  i10n.formatMessage('USERNAME',{})}),
  password: forms.CharField({widget: forms.PasswordInput, required: true, 
    label:  i10n.formatMessage('PASSWORD',{})})
});

var intlData=i10n.getIntl();

var MyComponent = React.createClass({
  mixins: [IntlMixin],
  render: function() {
    return (<form action="/$login/" method="post" onSubmit={this.onSubmit}>
      <forms.RenderForm form={LoginForm} ref="loginForm"/>
      <button> <FormattedMessage
                    message={intlData.messages['SUBMIT']}  /></button>
    </form>);
  }
});

module.exports = MyComponent;