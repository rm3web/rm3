var React = require('react');
var ReactIntl = require('react-intl');
var IntlMixin  = ReactIntl.IntlMixin;
var FormattedMessage  = ReactIntl.FormattedMessage;
var SitePath = require ('./sitepath');

var TextBlockComponent = React.createClass({
  mixins: [IntlMixin],

  getInitialState: function() {
    if (this.props.block) {
      return this.props.block;
    } else {
      return {};
    }
  },

  addText: function(e) {
    e.preventDefault();
    var blocks;
    if (this.state.format === 'section') {
      blocks = this.state.blocks;
    } else {
      blocks = [this.state];
    }
    blocks.push({format: 'html', source: ''});
    this.setState({blocks: blocks,
        format: 'section'});
  },

  addQuery: function(e) {
    e.preventDefault();
    var blocks;
    if (this.state.format === 'section') {
      blocks = this.state.blocks;
    } else {
      blocks = [this.state];
    }
    blocks.push({query:"parents",
      format:"pragma"});
    this.setState({blocks: blocks,
      format: 'section'});
  },

  render: function() {
    var buttons;
    if (!this.props.child) {
      if (this.props.proto === 'index') {
        buttons = (<div className="pure-g-r">
          <button onClick={this.addText} className="pure-button" id="addText">Add Text Section</button>
          <button onClick={this.addQuery} className="pure-button" id="addQuery">Add Query Section</button>
          </div>);
      } else {
        buttons = (<div className="pure-g-r">
          <button onClick={this.addText} className="pure-button" id="addText">Add Text Section</button>
          </div>);
      }
    }

    if (this.state.format === 'section') {
      var self = this;
      var blocks = this.state.blocks.map(function(block, i) {
          return (<TextBlockComponent key={i}
            prefix={self.props.prefix + '[blocks][' + i + ']'}
            block={block} child="true" />);
        });
      return (<fieldset>
        <input type="hidden" value="section" name={this.props.prefix + '[format]'}
          id={this.props.prefix + '[format]'} />
        <input type="hidden" id="numblocks" value={this.state.blocks.length} name="numblocks" />
        {blocks}
        {buttons}
      </fieldset>);
    } else if (this.state.format === 'pragma') {
      return (<fieldset>
        <div className="textblockbox">
        <input type="hidden" value="pragma" id={this.props.prefix + '[format]'}
         name={this.props.prefix + '[format]'} />
        <select name={this.props.prefix + '[query]'} 
          id={this.props.prefix + '[query]'} size="1">
         <option value="child">Query Children</option>
         <option value="parents">Query Parents</option>
         <option value="dir">Directory</option>
        </select></div>
        {buttons}
      </fieldset>);
    } else {
      var outstr = this.state.source;
      if (this.state.format === 'html') {
        outstr = this.state.htmltext;
      }
      return (<fieldset>
        <textarea rows="30" id={this.props.prefix + '[source]'} name={this.props.prefix + '[source]'}
          className="pure-input-1" placeholder="Posting" 
          defaultValue={outstr}>
        </textarea>
        <select size="1" name={this.props.prefix + '[format]'} id={this.props.prefix + '[format]'}
          defaultValue={this.state.format}>
        <option value="html">HTML</option>
        <option value="markdown">Markdown</option>
        </select>
        {buttons}
      </fieldset>);
    }
  }
});

var PathNameComponent = React.createClass({
  mixins: [IntlMixin],

  getInitialState: function() {
    if (this.props.leaf) {
      return {leaf: this.props.leaf, slug: false};
    } else {
      return {slug: true};
    }
  },

  slugSwitch: function(event) {
    this.setState({slug: event.target.checked});
  },

  render: function() {
    var path = this.props.path;
    if (path instanceof SitePath) {
      path = this.props.path.toDottedPath();
    }
    return (<fieldset>
      <div className="pure-u-1-3">
      <input className="pure-input-1" name="root" type="text" value={path} id="root"
        readOnly disabled />
      </div>
      <div className="pure-u-1-3">
      <input className="pure-input-1" type="text"
        defaultValue={this.state.leaf} disabled={this.state.slug} 
        name="leaf" id="leaf"
        placeholder={this.getIntlMessage("PATH")} />
      </div>
      <div className="pure-u-1-3">
      <label htmlFor="autogenSlug" className="pure-checkbox">
        <input type="checkbox" onChange={this.slugSwitch} 
         defaultChecked={this.state.slug} name="autogenSlug" id="slug" />
        <FormattedMessage message={this.getIntlMessage('AUTO_GENERATE_SLUG')} />
      </label>
      </div>
      </fieldset>);
  }
});

var SingleError = React.createClass({
  render: function() {
    return (<li>
      {this.props.error}
      </li>);
  }
});

var ErrorsList = React.createClass({
  mixins: [IntlMixin],
  render: function() {
    if (this.props.errors) {
      return (<div><ul>
      {this.props.errors.map(function(error, i){
          return (<SingleError key={i} error={error} />);
      })}
      </ul></div>);
    } else {
      return <div />;
    }
  }
});

exports.SingleError = SingleError;
exports.ErrorsList = ErrorsList;
exports.PathNameComponent = PathNameComponent;
exports.TextBlockComponent = TextBlockComponent;
