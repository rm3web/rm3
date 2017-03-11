var React = require('react');
var ReactIntl = require('react-intl');
var IntlProvider = ReactIntl.IntlProvider;
var FormattedMessage  = ReactIntl.FormattedMessage;
var JsxForms = require('rm3-react-controls');
var TextBlockComponent = require('textblocks-react-editor').TextBlockComponent;
var SingleError = JsxForms.SingleError;
var ErrorsList = JsxForms.ErrorsList;
var LinkedStateMixin = require('react-addons-linked-state-mixin');

var PageFormComponent = ReactIntl.injectIntl(React.createClass({
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
    state.sidebar = this.props.sidebar;
    state.excludeChildrenDisplay = this.props.excludeChildrenDisplay;
    return state;
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

      <TextBlockComponent prefix="posting" block={this.props.posting} {...this.props} />
      <b>Sidebar:</b>
      <TextBlockComponent prefix="sidebar" block={this.props.sidebar} {...this.props} />
      <fieldset>
      <label htmlFor="excludeChildrenDisplay" className="pure-checkbox">
        <input id="excludeChildrenDisplay" name="excludeChildrenDisplay" type="checkbox" value="true"
        checkedLink={this.linkState('excludeChildrenDisplay')} />
        <FormattedMessage id={'EXCLUDE_CHILDREN_DISPLAY'} />
      </label>
      </fieldset>

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

var PageFormWrapper = function PageFormWrapper(props) {
  return <IntlProvider messages={props.messages} locale='en'><PageFormComponent {...props} /></IntlProvider>
};


module.exports = PageFormWrapper;
