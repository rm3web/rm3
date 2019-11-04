var React = require('react');
var ReactIntl = require('react-intl');
var IntlProvider = ReactIntl.IntlProvider;
var FormattedMessage  = ReactIntl.FormattedMessage;
var TagControl = require('rm3-tag-control');
var JsxForms = require('rm3-react-controls');
var SingleError = JsxForms.SingleError;
var ErrorsList = JsxForms.ErrorsList;
var LinkedStateMixin = require('react-addons-linked-state-mixin');
var LinkedDataBox = require('linked-data-box').LinkedDataBox;
var ReactSuperSelect = require('react-super-select');
var ApiClient = require('../../../lib/apiclient');

var TagPageComponent = ReactIntl.injectIntl(React.createClass({
  mixins: [LinkedStateMixin],

  getInitialState: function() {
    var state = {
      tags: new LinkedDataBox()
    };
    state.predicates = {};
    state.predicateList = [];
    state.ontags = [];
    state.popularTags = [];

    state.ready = false;
    return state;
  },

  handleSave: function(e) {
    e.preventDefault();
    var apiClient = new ApiClient(this.props.apiPath);
    apiClient.page(this.props.baseurl).tags({tags: this.state.tags}).end(function(err, res) {
    });
  },

  handleRevert: function(e) {
    var self = this;
    var apiClient = new ApiClient(this.props.apiPath);
    apiClient.page(this.props.baseurl).tags().end(function(err, res) {
      // Slightly weird logic here because React doesn't like it if 
      // we just put the newly de-serialized tags structure 
      // in the state.
      self.state.tags.fromJSON(res.body.tags);
      self.state.predicates = {};
      self.state.ontags = res.body.ontags;
      self.state.predicateList = res.body.predicates;
      self.state.popularTags = res.body.popularTags;
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
    var apiClient = new ApiClient(this.props.apiPath);
    apiClient.page(this.props.baseurl).tags().end(function(err, res) {
      // Slightly weird logic here because React doesn't like it if 
      // we just put the newly de-serialized tags structure 
      // in the state.
      self.state.tags.fromJSON(res.body.tags);
      self.state.predicates = {};
      self.state.ontags = res.body.ontags;
      self.state.predicateList = res.body.predicates;
      self.state.popularTags = res.body.popularTags;
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
    var type = tag.type;
    this.state.tags.addTag(pred, {"@id": tag.tag, "objClass": tag.type});
    this.setState(this.state);
  },

  render: function() {
    return (
      <form id="tagaddform">
        <TagControl.Tags predicates={this.state.predicates} tags={this.state.tags} 
         readOnlyPredicates={{'navigation': true}} />
        <TagControl.TagInput ref="input" ready={this.state.ready} 
          predicates={this.state.predicateList} addTag={this.addTag} placeholder=""
          selectPlaceholder={this.props.intl.formatMessage({id:'SELECT_A_PREDICATE'})} 
          addMessage={this.props.intl.formatMessage({id:'ADD'})} links={this.state.ontags}
          defaultPredicate={{"id": "plain"}} popularTags={this.state.popularTags} />
        <hr />
        <button className="pure-button pure-button-primary" disabled={this.state.isSubmitting}
          onClick={this.handleSave} type="button"> <FormattedMessage
                    id={'SAVE'}  /></button>
        <button className="pure-button"
          onClick={this.handleRevert} type="button"> <FormattedMessage
                    id={'REVERT_CHANGES'}  /></button>
      </form>);

  }
}));

var TagPageWrapper = function TagPageWrapper(props) {
  return <IntlProvider messages={props.messages} locale='en'><TagPageComponent {...props} /></IntlProvider>
};

module.exports = TagPageWrapper;