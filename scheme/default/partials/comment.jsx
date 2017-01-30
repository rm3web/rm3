var React = require('react/addons');
var ReactIntl = require('react-intl');
var IntlProvider = ReactIntl.IntlProvider;
var FormattedMessage  = ReactIntl.FormattedMessage;
var request = require('superagent');
var JsxForms = require('rm3-react-controls');
var FormLib = require('../../../lib/formlib');
var SingleError = JsxForms.SingleError;
var ErrorsList = JsxForms.ErrorsList;
var LinkedStateMixin = require('react-addons-linked-state-mixin');

var CommentFormComponent = React.createClass({
  mixins: [LinkedStateMixin],

  getInitialState: function() {
    var state = {comment: '', errors: {}, message: ''};
    return state;
  },

  handleChange: function(event) {
    var change = {message: ''};
    change[event.target.name] = event.target.value
    this.setState(change);
  },

  onSubmit: function (event) {
    var self = this;
    event.preventDefault();
    this.setState({
      isSubmitting: true,
      message: 'Submitting comment...'
    });
    var payload = {comment: self.state.comment};
    if (self.state.name) {
      payload.name = self.state.name;
    }
    if (self.state.email) {
      payload.email = self.state.email;
    }
    if (self.state.url) {
      payload.url = self.state.url;
    }
    request
      .post(this.props.commentPath)
      .send(payload)
      .set('xsrf-token', this.props.csrfToken)
      .set('Accept', 'application/json')
      .end(function(err, res){
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
            return location.reload(true);
          }
          if (res.body.moderated) {
            return location.reload(true);
          }
        }
        FormLib.markError(self.state.errors,'__all__','unidentified response');
        self.setState({errors: self.state.errors});
      });
  },
  render: function() {
    var userInfo, ready;

    if (userPath) {
      ready = !this.state.comment;
    } else {
      userInfo = (
        <div className="pure-control-group">
    <label htmlFor="name">Name (required):</label>
    <input className="pure-input-1" type="text" name="name" required onChange={this.handleChange} /><br/>
    <label htmlFor="email">Email:</label>
    <input className="pure-input-1" type="text" name="email" onChange={this.handleChange} /><br/>
    <label htmlFor="url">Url:</label>
    <input className="pure-input-1" type="text" name="url" onChange={this.handleChange} /><br/>
    </div>
        );
      ready = !(this.state.comment && this.state.name);
    }

    return (
    <IntlProvider messages={this.props.messages} locale='en'><form onSubmit={this.onSubmit} method="post" className="pure-form pure-form-stacked">
    {userInfo}
    <legend>Add comment (plain text, no HTML, put a blank line between paragraphs)</legend>
    <textarea rows="5" className="pure-input-1" id="comment" name="comment"
      value={this.state.comment} onChange={this.handleChange}></textarea>
    <ErrorsList errors={this.state.errors.__all__} />
    <button className="pure-button pure-button-primary" disabled={ready || this.state.isSubmitting}> <FormattedMessage
                    id={'SUBMIT'}  /></button>
    <div>{this.state.message}</div>
    </form></IntlProvider>
    );
  }
})

module.exports = CommentFormComponent;