var React = require('react');
var ReactIntl = require('react-intl');
var IntlMixin  = ReactIntl.IntlMixin;
var FormattedMessage  = ReactIntl.FormattedMessage;

var PathNameComponent = React.createClass({
  mixins: [IntlMixin],

  getInitialState: function() {
    var state = {};
    state.leaf = this.props.leaf;
    if (state.leaf) {
      state.slug = false;
    } else {
      state.slug = true;
    }
    return state;
  },

  slugSwitch: function(event) {
    this.setState({slug: !this.state.slug});
  },

  render: function() {
    return (<fieldset>
      <div className="pure-u-1-3">
      <input className="pure-input-1" name="root" type="text" value={this.props.path} 
        readOnly disabled />
      </div>
      <div className="pure-u-1-3">
      <input className="pure-input-1" type="text"
        defaultValue={this.state.leaf} disabled={!this.state.slug} name="leaf" id="leaf"
        placeholder={this.getIntlMessage("PATH")} />
      </div>
      <div className="pure-u-1-3">
      <label htmlFor="autogenSlug" className="pure-checkbox">
        <input id="autogenSlug" name="autogenSlug" type="checkbox" 
          checked={this.state.slug} value="true" onChange={this.slugSwitch} />
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
