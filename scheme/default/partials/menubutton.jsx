var React = require('react');
var ReactIntl = require('react-intl');
var FormattedMessage  = ReactIntl.FormattedMessage;
var IntlProvider = ReactIntl.IntlProvider;
var AriaMenuButton = require('react-aria-menubutton');
var AmbWrapper = AriaMenuButton.Wrapper;
var AmbButton = AriaMenuButton.Button;
var AmbMenu = AriaMenuButton.Menu;
var AmbMenuItem = AriaMenuButton.MenuItem;

var MenuButton = ReactIntl.injectIntl(React.createClass({

  handleSelection: function(value, event) {
    if (value.func) {
      value.func();
    } else if (value.confirm) {
      answer = confirm(this.props.intl.formatMessage({id:"DO_YOU_REALLY_WANT_TO_GO_HERE"}));
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
          text={self.props.intl.formatMessage({id: item.label})}
          className='pure-menu-item AriaMenuButton-menuItem'
        > 
          <FormattedMessage
            id={item.label}  />
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
            id={this.props.label}  />
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
}));

var MenuButtonWrapper = function MenuButtonWrapper(props) {
  return <IntlProvider messages={props.messages} locale='en'><MenuButton {...props} /></IntlProvider>
};

module.exports = MenuButtonWrapper;