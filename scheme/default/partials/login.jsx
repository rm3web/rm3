var React = require('react');
var ReactIntl = require('react-intl');
var IntlMixin  = ReactIntl.IntlMixin;
var FormattedMessage  = ReactIntl.FormattedMessage;

var LoginFormComponent = React.createClass({
  mixins: [IntlMixin],
  render: function() {
    return (
    <form action="/$login/" method="post">
    <input type="hidden" name="_csrf" value={this.props.csrfToken} />
    <div>
    <label><FormattedMessage message={this.getIntlMessage('USERNAME')} />:</label>
    <input type="text" name="username" /><br/>
    </div>
    <div>
    <label><FormattedMessage message={this.getIntlMessage('PASSWORD')} />:</label>
    <input type="password" name="password" />
    </div>
    <div>
    <button> <FormattedMessage
                    message={this.getIntlMessage('SUBMIT')}  /></button>
    </div>
    </form>
    );
  }
})
module.exports = LoginFormComponent;