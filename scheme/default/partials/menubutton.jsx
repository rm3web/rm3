var React = require('react');
var ReactIntl = require('react-intl');
var IntlMixin  = ReactIntl.IntlMixin;
var FormattedMessage  = ReactIntl.FormattedMessage;
var AriaMenuButton = require('react-aria-menubutton');

var MenuButton = React.createClass({
  mixins: [IntlMixin],
  componentWillMount: function() {
    this.amb = AriaMenuButton({
      onSelection: this.handleSelection,
      closeOnSelection: false
    });
  },
  handleSelection: function(value, event) {
    if (value.confirm) {
      answer = confirm(this.getIntlMessage("DO_YOU_REALLY_WANT_TO_GO_HERE"));
      if (answer !=0) {
        window.location.href = value.url + "?sure=yes"
      }
    } else {
      window.location.href = value.url;
    }
  },
  render: function() {
    var MyButton = this.amb.Button;
    var MyMenu = this.amb.Menu;
    var MyMenuItem = this.amb.MenuItem;

    var actions = this.props.actions;
    var self = this;

    var menuItems = actions.map(function(item, i) {
      return (
        <li key={i}>
          <MyMenuItem className='pure-menu-item AriaMenuButton-menuItem'
            value={item} id={item.label} text={item.label}>
             <FormattedMessage
                    message={self.getIntlMessage(item.label)}  />
            
          </MyMenuItem>
        </li>
      );
    });
    return (
      <span className='AriaMenuButton pure-u-1'>
        <MyButton className='AriaMenuButton-trigger pure-button pure-u-1'>
        <FormattedMessage
                    message={this.getIntlMessage(this.props.label)}  />
        </MyButton>
        <MyMenu className='pure-menu AriaMenuButton-menu'>
          <ul className='pure-menu-list'>
          {menuItems}
        </ul>
        </MyMenu>
      </span>
    );
  }
})

module.exports = MenuButton;