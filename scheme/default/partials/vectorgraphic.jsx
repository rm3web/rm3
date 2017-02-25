var React = require('react');
var ReactIntl = require('react-intl');
var IntlProvider = ReactIntl.IntlProvider;
var FormattedMessage  = ReactIntl.FormattedMessage;
var JsxForms = require('rm3-react-controls');
var VectorForm = require('../../../lib/forms/vectorgraphic');
var SingleError = JsxForms.SingleError;
var ErrorsList = JsxForms.ErrorsList;
var TextBlockComponent = require('textblocks-react-editor').TextBlockComponent;
var LinkedStateMixin = require('react-addons-linked-state-mixin');
var Dropzone = require('react-dropzone');
var request = require('superagent');

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
    state.isSubmitting = false;
    state.abstract = this.props.abstract;
    return state;
  },

  onSubmit: function (event) {
    var self = this;
    event.preventDefault();
    self.setState({
      isSubmitting: true
    });
    var vectorForm = new VectorForm(this.props.section === 'edit');
    var body = {};
    ['root', 'leaf', 'autogenSlug', 'abstract', 'title'].forEach(function(field) {
      var val = document.getElementById(field)
      if (val) {
        body[field] = val.value;
      }
    })
    vectorForm.checkForm(body, function(err) {
      if (err) {
        console.log(err);
        self.setState({errors: err});
      } else {
        var x = document.forms["userform-form"];
        var req = request.post(window.location.href)
          .attach('svg', self.state.svg)
          .field('newResponse', true);
        var i;
        for (i = 0; i < x.length; i++) {
          if (x.elements[i].name) {
            if (x.elements[i].type === 'checkbox') {
              req.field(x.elements[i].name, x.elements[i].checked)
            } else {
              req.field(x.elements[i].name, x.elements[i].value)
            }
          }
        }

        req.end(function(err, res){
          self.setState({
            isSubmitting: false
          });
          if (err) {
            if (err.response.statusType === 5) {
              FormLib.markError(self.state.errors,'__all__',err.response.statusText);
              self.setState({errors: self.state.errors});
            }
          }
          if (res.accepted) {
            if (res.body.posted) {
              window.location.href = res.body.location;
            }
          }
          FormLib.markError(self.state.errors,'__all__','unidentified response');
          self.setState({errors: self.state.errors});
        });
      }
    });
  },

  onDrop: function (acceptedFiles) {
    this.setState({svg: acceptedFiles[0]});
  },

  render: function() {
    var buttonMessage = 'submit';
    var self = this;
    var pathBit;
    var minorChange;
    var preview;

    if (this.props.section === 'edit') {
      buttonMessage = 'edit';
      minorChange = (<label htmlFor="minorChange" className="pure-checkbox">
        <input id="minorChange" name="minorChange" type="checkbox" value="true" />
        <FormattedMessage id={'MINOR_CHANGE'} />
        </label>)
    } else {
      pathBit = (<JsxForms.PathNameComponent {...this.props} />);
    }
    if (this.state.svg) {
      preview = (<img style={{height: '100px', width: '100px', 'object-fit': 'contain'}} src={this.state.svg.preview} />);
    } else {
      preview = (<div>Try dropping some files here, or click to select files to upload.</div>);
    }

    return (
      <JsxForms.FormWrapper encType="multipart/form-data" onSubmit={this.onSubmit} proto={this.props.proto} section={this.props.section} revisionId={this.props.revisionId}>
      <fieldset><h1>
       <textarea rows="1" className="pure-input-1" id="title"
        placeholder={this.props.intl.formatMessage({id: "TITLE"})} name="title" 
        valueLink={this.linkState('title')} /></h1>
      <ErrorsList errors={this.state.errors.title} />
      </fieldset>
      <fieldset>
      <textarea rows="5" className="pure-input-1" name="abstract" id="abstract"
        placeholder={this.props.intl.formatMessage({id:"ABSTRACT"})}
        valueLink={this.linkState('abstract')} >
      </textarea>
      <ErrorsList errors={this.state.errors.abstract} />
      </fieldset>
      {pathBit}
      <TextBlockComponent prefix="posting" {...this.props} />

      <Dropzone multiple={false} onDrop={this.onDrop}>
        {preview}
      </Dropzone>

      <ErrorsList errors={this.state.errors.__all__} />

      <fieldset className="memobar">
      <textarea rows="1" className="pure-input-1" 
        placeholder={this.props.intl.formatMessage({id:"MEMO"})} name="memo" 
        valueLink={this.linkState('memo')} />
        {minorChange}
      </fieldset>

      <JsxForms.SubmitButton onClick={this.onSubmit} disabled={this.state.isSubmitting} locales={this.props.intl.locales} messages={this.props.intl.messages} isDraft={this.props.isDraft} buttonMessage={buttonMessage} />
      
    </JsxForms.FormWrapper>);
  }
}));

var VectorGraphicFormWrapper = function VectorGraphicWrapper(props) {
  return <IntlProvider messages={props.messages} locale='en'><VectorGraphicFormComponent {...props} /></IntlProvider>
};


module.exports = VectorGraphicFormWrapper;
