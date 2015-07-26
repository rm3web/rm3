var React = require('react');
var ReactIntl = require('react-intl');
var IntlMixin  = ReactIntl.IntlMixin;
var FormattedMessage  = ReactIntl.FormattedMessage;

var PathNameComponent = React.createClass({
  mixins: [IntlMixin],

  getInitialState: function() {
    if (this.props.leaf) {
      return {leaf: this.props.leaf, slug: false}
    } else {
      return {slug: true}
    }
  },

  slugSwitch: function(event) {
    this.setState({slug: event.target.checked});
  },

  render: function() {
    return (<fieldset>
      <div className="pure-u-1-3">
      <input className="pure-input-1" name="root" type="text" value={this.props.path} 
        readOnly disabled />
      </div>
      <div className="pure-u-1-3">
      <input className="pure-input-1" type="text"
        defaultValue={this.state.leaf} disabled={this.state.slug} name="leaf" id="leaf"
        placeholder={this.getIntlMessage("PATH")} />
      </div>
      <div className="pure-u-1-3">
      <label htmlFor="autogenSlug" className="pure-checkbox">
        <input type="checkbox" onChange={this.slugSwitch} defaultChecked={this.state.slug} />
        <FormattedMessage message="AUTO_GENERATE_SLUG" />
      </label>
      </div>
      </fieldset>);
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
      return <div />;
    }
  }
});

exports.SingleError = SingleError;
exports.ErrorsList = ErrorsList;
exports.PathNameComponent = PathNameComponent;
