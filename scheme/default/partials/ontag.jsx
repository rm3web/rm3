var React = require('react');
var ReactIntl = require('react-intl');
var IntlProvider = ReactIntl.IntlProvider;
var FormattedMessage  = ReactIntl.FormattedMessage;
var JsxForms = require('rm3-react-controls');
var SingleError = JsxForms.SingleError;
var ErrorsList = JsxForms.ErrorsList;
var LinkedStateMixin = require('react-addons-linked-state-mixin');

var OntagEntry = React.createClass({
  displayName: 'OntagEntry',

  mixins: [LinkedStateMixin],

  getInitialState: function() {
    var state = {};
    if (this.props.desc) {
      state.desc = this.props.desc;
    }
    if (this.props.uri) {
      state.uri = this.props.uri;
    }
    if (this.props.value) {
      state.value = this.props.value;
    }
    return state;
  },

  render: function() {
    return (<fieldset>
      <div className="pure-u-1-3">
      <input name={this.props.prefix + '[desc]'}
        className="pure-input-1" valueLink={this.linkState('desc')} placeholder="Description" />
      </div>
      <div className="pure-u-1-3">
      <input name={this.props.prefix + '[uri]'}
        className="pure-input-1" valueLink={this.linkState('uri')}  placeholder="URI" />
      </div>
      <div className="pure-u-1-3">
      <input name={this.props.prefix + '[value]'}
        className="pure-input-1" valueLink={this.linkState('value')} placeholder="Value" />
      </div>
    </fieldset>);
  }
});

var OntagProperties = React.createClass({
  displayName: 'OntagProperties',

  getInitialState: function() {
    var properties = this.props.properties;
    return {properties: properties};
  },

  render: function() {
    var prefix = this.props.prefix
    var blocks = this.state.properties.map(function (prop, i) {
      return (<OntagEntry prefix={prefix + '[' + i + ']'} {...prop} />)
    })
    return (<div>{blocks}</div>);
  }
})

var OntagFormComponent = ReactIntl.injectIntl(React.createClass({
  mixins: [LinkedStateMixin],

  getInitialState: function() {
    var state = {};
    if (this.props.errors) {
      state.errors = this.props.errors;
    } else {
      state.errors = {};
    }
    state.title = this.props.title;
    state.abstract = this.props.abstract;
    state.uri = this.props.uri;
    if (this.props.properties) {
      state.properties = this.props.properties;
    } else {
      state.properties = [];
    }
    return state;
  },

  handleAddRow: function(e) {
    e.preventDefault();
    this.state.properties.push({});
    this.setState({properties: this.state.properties});
  },

  render: function() {
    var buttonMessage = 'submit';
    var self = this;
    var pathBit;
    var minorChange;

    if (this.props.section === 'edit') {
      buttonMessage = 'edit';
      minorChange = (<label htmlFor="minorChange" className="pure-checkbox">
        <input id="minorChange" name="minorChange" type="checkbox" value="true" />
        <FormattedMessage id={'MINOR_CHANGE'} />
        </label>)
    } else {
      pathBit = (<JsxForms.PathNameComponent {...this.props} />);
    }

    return (
      <JsxForms.FormWrapper onSubmit={this.onSubmit} proto={this.props.proto} section={this.props.section} revisionId={this.props.revisionId}>
      <fieldset><h1>
       <textarea rows="1" className="pure-input-1" 
        placeholder={this.props.intl.formatMessage({id:"TITLE"})} name="title" 
        valueLink={this.linkState('title')} /></h1>
      <ErrorsList errors={this.state.errors.title} />
      </fieldset>
      <fieldset>
      <textarea rows="5" className="pure-input-1" name="abstract" 
        placeholder={this.props.intl.formatMessage({id:"ABSTRACT"})}
        valueLink={this.linkState('abstract')} >
      </textarea>
      <ErrorsList errors={this.state.errors.abstract} />
      </fieldset>
      {pathBit}

      <OntagProperties prefix="properties" properties={this.state.properties}/>
      <button onClick={this.handleAddRow} className="pure-button" id="addRow">Add Row</button>

      <fieldset className="memobar">
      <textarea rows="1" className="pure-input-1" 
        placeholder={this.props.intl.formatMessage({id:"MEMO"})} name="memo" 
        valueLink={this.linkState('memo')} />
        {minorChange}
      </fieldset>

      <ErrorsList errors={this.state.errors.__all__} />
      <JsxForms.SubmitButton locales={this.props.intl.locales} messages={this.props.intl.messages} isDraft={this.props.isDraft} buttonMessage={buttonMessage} />
      
    </JsxForms.FormWrapper>);
  }
}));

var OntagFormWrapper = function OntagFormWrapper(props) {
  return <IntlProvider messages={props.messages} locale='en'><OntagFormComponent {...props} /></IntlProvider>
};


module.exports = OntagFormWrapper;
