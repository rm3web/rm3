var React = require('react');
var ReactIntl = require('react-intl');
var IntlMixin  = ReactIntl.IntlMixin;
var FormattedMessage  = ReactIntl.FormattedMessage;

var TextBlockComponent = React.createClass({
  mixins: [IntlMixin],

  getInitialState: function() {
    if (this.props.block) {
      return this.props.block;
    } else {
      return {};
    }
  },

  componentDidMount: function() {
    this.setState({mounted:true});
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
    if (!this.props.child && this.state.mounted) {
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

exports.TextBlockComponent = TextBlockComponent;
