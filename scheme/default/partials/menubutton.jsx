var React = require('react');
var ReactIntl = require('react-intl');
var IntlMixin  = ReactIntl.IntlMixin;
var FormattedMessage  = ReactIntl.FormattedMessage;
var AriaMenuButton = require('react-aria-menubutton');
var AmbWrapper = AriaMenuButton.Wrapper;
var AmbButton = AriaMenuButton.Button;
var AmbMenu = AriaMenuButton.Menu;
var AmbMenuItem = AriaMenuButton.MenuItem;

var MenuButton = React.createClass({
  mixins: [IntlMixin],

  handleSelection: function(value, event) {
    if (value.func) {
      value.func();
    } else if (value.confirm) {
      answer = confirm(this.getIntlMessage("DO_YOU_REALLY_WANT_TO_GO_HERE"));
      if (answer !=0) {
        window.location.href = value.url + "?sure=yes"
      }
    } else {
      window.location.href = value.url;
    }
  },
  render: function() {
    var self = this;
    var actions = this.props.actions;

    var menuItems = actions.map(function(item, i) {
      return (
        <AmbMenuItem
          key={i}
          tag='li'
          value={item}
          id={item.label}
          text={self.getIntlMessage(item.label)}
          className='pure-menu-item AriaMenuButton-menuItem'
        > 
          <FormattedMessage
            message={self.getIntlMessage(item.label)}  />
        </AmbMenuItem>
      );
    });

    return (
      <AmbWrapper
        className='AriaMenuButton pure-u-1'
        onSelection={self.handleSelection}
      >
        <AmbButton className='AriaMenuButton-trigger pure-button pure-u-1'>
          <span className='AriaMenuButton-triggerText'>
            <FormattedMessage
            message={this.getIntlMessage(this.props.label)}  />
          </span>
        </AmbButton>
        <AmbMenu className='pure-menu AriaMenuButton-menu'>
        <ul className='pure-menu-list'>
          {menuItems}
        </ul>
        </AmbMenu>
      </AmbWrapper>
    );
  }
})

module.exports = MenuButton;