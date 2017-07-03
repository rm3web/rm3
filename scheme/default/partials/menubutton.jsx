var React = require('react');
var ReactIntl = require('react-intl');
var FormattedMessage  = ReactIntl.FormattedMessage;
var IntlProvider = ReactIntl.IntlProvider;
var AriaMenuButton = require('react-aria-menubutton');
var AmbWrapper = AriaMenuButton.Wrapper;
var AmbButton = AriaMenuButton.Button;
var AmbMenu = AriaMenuButton.Menu;
var AmbMenuItem = AriaMenuButton.MenuItem;
var ReactModal = require('react-modal');

const customModalStyles = {
  content : {
    top                   : '50%',
    left                  : '50%',
    right                 : 'auto',
    bottom                : 'auto',
    marginRight           : '-50%',
    transform             : 'translate(-50%, -50%)'
  }
};

class MenuWrapper extends React.Component {
  constructor(props) {
    super(props);
    this.state =  { showModal: false };
    this.handleSelection = this.handleSelection.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
  }

  handleSelection(value, event) {
    if (value.func) {
      value.func();
    } else if (value.confirm) {
      this.setState({ showModal: true , modalLink: value.url + "?sure=yes"});
    } else {
      window.location.href = value.url;
    }
  }

  handleCloseModal(event) {
    this.setState({ showModal: false });
  }

  render() {
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

    var modal = (<ReactModal 
           isOpen={this.state.showModal}
           style={customModalStyles}
           onRequestClose={this.handleCloseModal}
           contentLabel="Confirmation"
        >
        <FormattedMessage id={'DO_YOU_REALLY_WANT_TO_GO_HERE'} />
          <br /><a className="pure-button" href={this.state.modalLink}>Yes</a>
          <button className="pure-button" onClick={this.handleCloseModal}>No</button>

        </ReactModal>
      )

    return (
      <AmbWrapper
        className='AriaMenuButton pure-u-1'
        onSelection={self.handleSelection}
      >
        {modal}
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
}

var MenuButton = ReactIntl.injectIntl(MenuWrapper);

var MenuButtonWrapper = function MenuButtonWrapper(props) {
  return <IntlProvider messages={props.messages} locale='en'><MenuButton {...props} /></IntlProvider>
};

module.exports = MenuButtonWrapper;