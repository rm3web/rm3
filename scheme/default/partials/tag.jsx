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

// Hack: Moved this here because something about react-super-select and 
// rm3-tag-control mean that if I pull the version from there, I get 
// invariant errors and the control doesn't work.
var TagInput = React.createClass({

  getInitialState: function() {
    return {
      tagText: '',
      predicate: 'plain'
    };
  },

  doAdd: function() {
    if (this.state.predicate.id === 'plain') {
      this.props.addTag(
      {tag: this.state.tagText}
      );
    } else {
      this.props.addTag(
        {predicate: this.state.predicate,
         tag: this.state.tagText}
        );
    }
  },

  onKeyInput: function(e) {
    // Enter KEY
    if (e.keyCode === 13) {
      this.doAdd();
      return false;
    }
  },

  handleAdd: function(e) {
    e.preventDefault();
    this.doAdd();
  },

  onChangePredicate: function (predicate) {
    this.setState({ predicate: predicate});
  },

  onChangeTag: function(e) {
    this.setState({ tagText: e.target.value});
  },

  render: function() {
    const t = (
      <div>
      <ReactSuperSelect placeholder={this.props.selectPlaceholder}
                  dataSource={this.props.predicates}
                  value={this.state.predText} groupBy="metadataClass"
                  onChange={this.onChangePredicate}
                  clearable= {false} />
       <input type={'text'} value={this.state.tagText}
          onChange={this.onChangeTag} disabled = {!this.props.ready}
          style= {{width: '40%', lineHeight: '30px'}}
          onKeyUp = {this.onKeyInput} />
       <button className="pure-button pure-button-primary" disabled={!this.props.ready}
          style= {{width: '9%', lineHeight: '30px'}} onClick={this.handleAdd} type="button">
          {this.props.addMessage}</button>

      </div>
    );
    return t;
  }
});


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
      <div>
        <TagControl.Tags predicates={this.state.predicates} tags={this.state.tags} />
        <TagInput ref="input" ready={this.state.ready} 
          predicates={this.state.predicateList} addTag={this.addTag} 
          selectPlaceholder={this.getIntlMessage('SELECT_A_PREDICATE')} 
          addMessage={this.getIntlMessage('ADD')}/>
        <hr />
        <button className="pure-button pure-button-primary" disabled={this.state.isSubmitting}
          onClick={this.handleSave} type="button"> <FormattedMessage
                    message={this.getIntlMessage('SAVE')}  /></button>
        <button className="pure-button"
          onClick={this.handleRevert} type="button"> <FormattedMessage
                    message={this.getIntlMessage('REVERT_CHANGES')}  /></button>
      </div>);

  }
});

module.exports = TagPageComponent;