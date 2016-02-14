var React = require('react');
var ReactIntl = require('react-intl');
var IntlMixin  = ReactIntl.IntlMixin;
var FormattedMessage  = ReactIntl.FormattedMessage;
var TagControl = require('rm3-tag-control');
var JsxForms = require('rm3-react-controls');
var SingleError = JsxForms.SingleError;
var ErrorsList = JsxForms.ErrorsList;
var LinkedStateMixin = require('react-addons-linked-state-mixin');
var LinkedDataBox = require('linked-data-box').LinkedDataBox;
var ReactSuperSelect = require('react-super-select');
var ApiClient = require('../../../lib/apiclient')

var TagPageComponent = React.createClass({
  mixins: [IntlMixin, LinkedStateMixin],

  getInitialState: function() {
    var state = {
      tags: new LinkedDataBox()
    };
    state.predicates = {};
    state.predicateList = [];

    state.ready = false;
    return state;
  },

  handleSave: function(e) {
    e.preventDefault();
    var apiClient = new ApiClient('http://127.0.0.1:4000');
    apiClient.page(this.props.baseurl).tags({tags: this.state.tags}).end(function(err, res) {
    });
  },

  handleRevert: function(e) {
    var self = this;
    var apiClient = new ApiClient('http://127.0.0.1:4000');
    apiClient.page(this.props.baseurl).tags().end(function(err, res) {
      // Slightly weird logic here because React doesn't like it if 
      // we just put the newly de-serialized tags structure 
      // in the state.
      self.state.tags.fromJSON(res.body.tags);
      self.state.predicates = {};
      self.state.predicateList = res.body.predicates;
      self.state.predicateList.forEach( function(currentValue) {
        self.state.predicates[currentValue.id] = {
          name: currentValue.name,
          metadataClass: currentValue.metadataClass,
        };
      });
      self.setState(self.state);
    });
  },

  componentDidMount: function() {
    var self = this;
    var apiClient = new ApiClient('http://127.0.0.1:4000');
    apiClient.page(this.props.baseurl).tags().end(function(err, res) {
      // Slightly weird logic here because React doesn't like it if 
      // we just put the newly de-serialized tags structure 
      // in the state.
      self.state.tags.fromJSON(res.body.tags);
      self.state.predicates = {};
      self.state.predicateList = res.body.predicates;
      self.state.predicateList.forEach( function(currentValue) {
        self.state.predicates[currentValue.id] = {
          name: currentValue.name,
          metadataClass: currentValue.metadataClass,
        };
      });
      self.state.ready = true;
      self.setState(self.state);
    });
  },

  addTag: function(tag) {
    var pred = 'plain';
    if (tag.hasOwnProperty('predicate')) {
      pred = tag.predicate.id;
    }
    this.state.tags.addTag(pred, {"@id": tag.tag, "objClass": "tag"});
    this.setState(this.state);
  },

  render: function() {
    return (
      <form id="tagaddform">
        <TagControl.Tags predicates={this.state.predicates} tags={this.state.tags} 
         readOnlyPredicates={{'navigation': true}} />
        <TagControl.TagInput ref="input" ready={this.state.ready} 
          predicates={this.state.predicateList} addTag={this.addTag} 
          selectPlaceholder={this.getIntlMessage('SELECT_A_PREDICATE')} 
          addMessage={this.getIntlMessage('ADD')}
          defaultPredicate={{"id": "plain"}} />
        <hr />
        <button className="pure-button pure-button-primary" disabled={this.state.isSubmitting}
          onClick={this.handleSave} type="button"> <FormattedMessage
                    message={this.getIntlMessage('SAVE')}  /></button>
        <button className="pure-button"
          onClick={this.handleRevert} type="button"> <FormattedMessage
                    message={this.getIntlMessage('REVERT_CHANGES')}  /></button>
      </form>);

  }
});

module.exports = TagPageComponent;