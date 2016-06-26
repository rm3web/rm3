var React = require('react/addons');
var ReactIntl = require('react-intl');
var IntlProvider = ReactIntl.IntlProvider;
var FormattedMessage  = ReactIntl.FormattedMessage;
var JsxForms = require('rm3-react-controls');
var SingleError = JsxForms.SingleError;
var ErrorsList = JsxForms.ErrorsList;
var LinkedStateMixin = require('react-addons-linked-state-mixin');

var PredicateFormComponent = ReactIntl.injectIntl(React.createClass({
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
    return state;
  },

  render: function() {
    var buttonMessage = 'submit';
    var action = 'create.html?type=' + this.props.proto;
    var self = this;
    var pathBit;

    if (this.props.section === 'edit') {
      buttonMessage = 'edit';
      action = 'edit.html'
    } else {
      pathBit = (<JsxForms.PathNameComponent {...this.props} />);
    }

    return (
      <form id="draft" action={action} id="userform-form" method="post" className="pure-form pure-form-stacked" onSubmit={this.onSubmit}>
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

      <ErrorsList errors={this.state.errors.__all__} />
      <fieldset>
      <div className="pure-g-r">
        <div className="pure-u-1-3">
          <button type="submit" className="pure-button pure-button-primary">{buttonMessage}</button>
        </div>
        <div className="pure-u-2-3">
          <label htmlFor="saveAsDraft" className="pure-checkbox">
            <input id="saveAsDraft" name="saveAsDraft" type="checkbox" value="true" />
            <FormattedMessage id={'SAVE_AS_DRAFT'} />
          </label>
        </div>
      </div>
      </fieldset>
      
    </form>);
  }
}));

var PredicateFormWrapper = function PredicateFormWrapper(props) {
  return <IntlProvider messages={props.messages} locale='en'><PredicateFormComponent {...props} /></IntlProvider>
};


module.exports = PredicateFormWrapper;
