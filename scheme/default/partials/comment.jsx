var React = require('react/addons');
var ReactIntl = require('react-intl');
var IntlMixin  = ReactIntl.IntlMixin;
var FormattedMessage  = ReactIntl.FormattedMessage;
var request = require('superagent');
var JsxForms = require('rm3-react-controls');
var FormLib = require('../../../lib/formlib');
var SingleError = JsxForms.SingleError;
var ErrorsList = JsxForms.ErrorsList;
var LinkedStateMixin = require('react-addons-linked-state-mixin');

var CommentFormComponent = React.createClass({
  mixins: [IntlMixin, LinkedStateMixin],

  getInitialState: function() {
    var state = {comment: '', errors: {}, message: ''};
    return state;
  },

  handleChange: function(event) {
    this.setState({comment: event.target.value, message: ''});
  },

  onSubmit: function (event) {
    var self = this;
    event.preventDefault();
    this.setState({
      isSubmitting: true,
      message: 'Submitting comment...'
    });
    request
      .post(this.props.commentPath)
      .send({ comment: self.state.comment})
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
            return self.setState({comment: '', message: 'This message has been held for moderation'})
          }
        }
        FormLib.markError(self.state.errors,'__all__','unidentified response');
        self.setState({errors: self.state.errors});
      });
  },
  render: function() {
    var userInfo;
    if (!userPath) {
      userInfo = (
        <div className="pure-control-group">
    <label htmlFor="Name">Name:</label>
    <input className="pure-input-1" type="text" name="name" /><br/>
    <label htmlFor="Email">Email:</label>
    <input className="pure-input-1" type="text" name="email" /><br/>
    <label htmlFor="Name">Url:</label>
    <input className="pure-input-1" type="text" name="url" /><br/>
    </div>
        );
    }
    return (
    <form onSubmit={this.onSubmit} method="post" className="pure-form pure-form-stacked">
    {userInfo}
    <legend>Add comment (plain text, no HTML, put a blank line between paragraphs)</legend>
    <textarea rows="5" className="pure-input-1" id="comment" name="comment"
      value={this.state.comment} onChange={this.handleChange}></textarea>
    <ErrorsList errors={this.state.errors.__all__} />
    <button className="pure-button pure-button-primary" disabled={!this.state.comment || this.state.isSubmitting}> <FormattedMessage
                    message={this.getIntlMessage('SUBMIT')}  /></button>
    <div>{this.state.message}</div>
    </form>
    );
  }
})

module.exports = CommentFormComponent;