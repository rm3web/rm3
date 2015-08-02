var React = require('react');
var ReactIntl = require('react-intl');
var IntlMixin  = ReactIntl.IntlMixin;
var FormattedMessage  = ReactIntl.FormattedMessage;
var JsxForms = require('../../../lib/jsx_forms.jsx');
var SingleError = JsxForms.SingleError;
var ErrorsList = JsxForms.ErrorsList;

var PageFormComponent = React.createClass({
  mixins: [IntlMixin],

  getInitialState: function() {
    if (this.props.errors) {
      return {errors: this.props.errors};
    } else {
      return {errors: {}};
    }
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
      pathBit = (<JsxForms.PathNameComponent path={this.props.path} leaf={this.props.leaf} />);
    }

    return (
      <form id="draft" action={action} id="userform-form" method="post" className="pure-form pure-form-stacked" onSubmit={this.onSubmit}>
      <fieldset><h1>
       <textarea rows="1" className="pure-input-1" placeholder={this.getIntlMessage("TITLE")}
        defaultValue={this.props.title} name="title" id="title" /></h1>
      <ErrorsList errors={this.state.errors.title} />
      </fieldset>
      <fieldset>
      <textarea rows="5" className="pure-input-1" id="abstract" name="abstract" placeholder={this.getIntlMessage("ABSTRACT")}>
      </textarea>
      <ErrorsList errors={this.state.errors.abstract} />
      </fieldset>
      {pathBit}
      <JsxForms.TextBlockComponent prefix="posting" proto={this.props.proto} block={this.props.block} />

      <ErrorsList errors={this.state.errors.__all__} />
      <fieldset>
      <div className="pure-g-r">
        <div className="pure-u-1-3">
          <button type="submit" className="pure-button pure-button-primary"><FormattedMessage message={buttonMessage} /></button>
        </div>
        <div className="pure-u-2-3">
          <label htmlFor="save-as-draft" className="pure-checkbox">
            <input id="save-as-draft" name="save-as-draft" type="checkbox" value="true" />
            <FormattedMessage message={this.getIntlMessage('SAVE_AS_DRAFT')} />
          </label>
        </div>
      </div>
      </fieldset>
      
    </form>);
  }
});

module.exports = PageFormComponent;
