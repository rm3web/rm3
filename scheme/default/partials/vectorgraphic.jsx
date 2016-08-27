var React = require('react/addons');
var ReactIntl = require('react-intl');
var IntlProvider = ReactIntl.IntlProvider;
var FormattedMessage  = ReactIntl.FormattedMessage;
var JsxForms = require('rm3-react-controls');
var SingleError = JsxForms.SingleError;
var ErrorsList = JsxForms.ErrorsList;
var LinkedStateMixin = require('react-addons-linked-state-mixin');

var VectorGraphicFormComponent = ReactIntl.injectIntl(React.createClass({
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
    var pathBit, submitBit;

    if (this.props.section === 'edit') {
      buttonMessage = 'edit';
      action = 'edit.html'
      if (this.props.revisionId) {
        action = action + '?revisionId=' + this.props.revisionId;
      }
    } else {
      pathBit = (<JsxForms.PathNameComponent {...this.props} />);
    }

    if (this.props.isDraft) {
      submitBit = (<fieldset>
        <div className="pure-g-r">
          <div className="pure-u-1-3">
            <button type="submit" className="pure-button pure-button-primary">{buttonMessage}</button>
          </div>
          <div className="pure-u-1-3">
            <label htmlFor="saveAsDraft" className="pure-checkbox">
              <input id="saveAsDraft" name="saveAsDraft" type="checkbox" value="true" checked="true" />
              <FormattedMessage id={'SAVE_AS_DRAFT'} />
            </label>
          </div>
          <div className="pure-u-1-3">
            <label htmlFor="createNewDraft" className="pure-checkbox">
              <input id="createNewDraft" name="createNewDraft" type="checkbox" value="true" />
              <FormattedMessage id={'CREATE_NEW_DRAFT'} />
            </label>
          </div>
        </div>
        </fieldset>)
    } else {
      submitBit = (<fieldset>
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
        </fieldset>)
    }


    return (
      <form encType="multipart/form-data" action={action} id="userform-form" method="post" className="pure-form pure-form-stacked" onSubmit={this.onSubmit}>
      <fieldset><h1>
       <textarea rows="1" className="pure-input-1" 
        placeholder={this.props.intl.formatMessage({id: "TITLE"})} name="title" 
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
      <input type="file" name="svg" />
      </fieldset>

      <ErrorsList errors={this.state.errors.__all__} />

      {submitBit}
      
    </form>);
  }
}));

var VectorGraphicFormWrapper = function VectorGraphicWrapper(props) {
  return <IntlProvider messages={props.messages} locale='en'><VectorGraphicFormComponent {...props} /></IntlProvider>
};


module.exports = VectorGraphicFormWrapper;
