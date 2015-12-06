var React = require('react');
var ReactIntl = require('react-intl');
var IntlMixin  = ReactIntl.IntlMixin;
var FormattedMessage  = ReactIntl.FormattedMessage;

var LoginFormComponent = React.createClass({
  mixins: [IntlMixin],
  render: function() {
    return (
    <form action="/$login/" method="post" className="pure-form pure-form-aligned">
    <input type="hidden" name="_csrf" value={this.props.csrfToken} />
    <div className="pure-control-group">
    <label htmlFor="username"><FormattedMessage message={this.getIntlMessage('USERNAME')} />:</label>
    <input type="text" name="username" /><br/>
    </div>
    <div className="pure-control-group">
    <label htmlFor="password"><FormattedMessage message={this.getIntlMessage('PASSWORD')} />:</label>
    <input type="password" name="password" />
    </div>
    <div className="pure-controls">
    <button className="pure-button pure-button-primary"> <FormattedMessage
                    message={this.getIntlMessage('SUBMIT')}  /></button>
    </div>
    </form>
    );
  }
})
module.exports = LoginFormComponent;