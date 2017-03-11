var React = require('react');
var ReactIntl = require('react-intl');
var IntlProvider = ReactIntl.IntlProvider;
var FormattedMessage  = ReactIntl.FormattedMessage;
var JsxForms = require('rm3-react-controls');
var SingleError = JsxForms.SingleError;
var ErrorsList = JsxForms.ErrorsList;
var LinkedStateMixin = require('react-addons-linked-state-mixin');

var EmailFormComponent = ReactIntl.injectIntl(React.createClass({
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
    state.text = this.props.text;
    state.description = this.props.description;
    return state;
  },

  render: function() {
    var buttonMessage = 'submit';
    var self = this;
    var pathBit;

    if (this.props.section === 'edit') {
      buttonMessage = 'edit';      
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
      <fieldset>
      <textarea rows="1" className="pure-input-1" 
        placeholder={this.props.intl.formatMessage({id:"EMAIL"})} name="address" 
        valueLink={this.linkState('address')} />
      <ErrorsList errors={this.state.errors.address} />
      </fieldset>
      <fieldset>
      <textarea rows="5" className="pure-input-1" name="description" 
        placeholder={this.props.intl.formatMessage({id:"DESCRIPTION"})}
        valueLink={this.linkState('description')} >
      </textarea>
      <ErrorsList errors={this.state.errors.abstract} />
      </fieldset>

      <ErrorsList errors={this.state.errors.__all__} />
      <JsxForms.SubmitButton locales={this.props.intl.locales} messages={this.props.intl.messages} isDraft={this.props.isDraft} buttonMessage={buttonMessage} />
      
    </JsxForms.FormWrapper>);
  }
}));

var EmailFormWrapper = function EmailFormWrapper(props) {
  return <IntlProvider messages={props.messages} locale='en'><EmailFormComponent {...props} /></IntlProvider>
};


module.exports = EmailFormWrapper;
