var React = require('react/addons');
require('node-jsx').install({extension: '.jsx'});
var TestUtils = React.addons.TestUtils;
var createComponent = require('../lib/create-component');
var UserFormComponent = require('../../scheme/default/partials/user.jsx');
var i10n = require('../../lib/i10n');

describe('Post component', function() {
  it('should render', function() {
    var intl = i10n.getIntl();
    var form = createComponent(UserFormComponent, {
      locales: intl.locales,
      messages: intl.messages,
      section: 'create',
      proto: 'user',
      username: 'username',
      fullname: 'fullname',
      profileUrl: 'profileUrl',
      email: 'email',
      profileText: 'profileText',
      disableLogin: false,
      body: {},
      errors: {}
    });
    var usernameFieldSet = form.props.children[0];
    usernameFieldSet.type.should.equal('fieldset');
    usernameFieldSet.props.children[0].type.should.equal('label');
    usernameFieldSet.props.children[1].props.section.should.equal('create');
    usernameFieldSet.props.children[1].props.username.should.equal('username');
    usernameFieldSet.props.children[2].type.displayName.should.equal('ErrorsList');

    var fullnameFieldSet = form.props.children[1];
    fullnameFieldSet.type.should.equal('fieldset');
    fullnameFieldSet.props.children[0].type.should.equal('label');
    fullnameFieldSet.props.children[1].type.should.equal('input');
    fullnameFieldSet.props.children[1].props.defaultValue.should.equal('fullname');
    fullnameFieldSet.props.children[1].props.id.should.equal('fullname');
    fullnameFieldSet.props.children[1].props.name.should.equal('fullname');
    fullnameFieldSet.props.children[2].type.displayName.should.equal('ErrorsList');

    var passwordFieldSet = form.props.children[2];
    passwordFieldSet.type.should.equal('fieldset');
    passwordFieldSet.props.children[0].type.should.equal('label');
    passwordFieldSet.props.children[1].type.should.equal('input');
    passwordFieldSet.props.children[1].props.defaultValue.should.equal('');
    passwordFieldSet.props.children[1].props.id.should.equal('password1');
    passwordFieldSet.props.children[1].props.name.should.equal('password1');
    passwordFieldSet.props.children[2].type.displayName.should.equal('ErrorsList');
    passwordFieldSet.props.children[3].type.should.equal('input');
    passwordFieldSet.props.children[3].props.defaultValue.should.equal('');
    passwordFieldSet.props.children[3].props.id.should.equal('password2');
    passwordFieldSet.props.children[3].props.name.should.equal('password2');
    passwordFieldSet.props.children[4].type.displayName.should.equal('ErrorsList');

    var disabledLoginFieldSet = form.props.children[3];
    disabledLoginFieldSet.type.should.equal('fieldset');
    disabledLoginFieldSet.props.children[0].type.should.equal('label');
    disabledLoginFieldSet.props.children[0].props.children[0].type.should.equal('input');
    disabledLoginFieldSet.props.children[0].props.children[0].props.id.should.equal('disableLogin');
    disabledLoginFieldSet.props.children[0].props.children[0].props.name.should.equal('disableLogin');
    disabledLoginFieldSet.props.children[1].type.displayName.should.equal('ErrorsList');

    var profileUrlFieldSet = form.props.children[4];
    profileUrlFieldSet.type.should.equal('fieldset');
    profileUrlFieldSet.props.children[0].type.should.equal('label');
    profileUrlFieldSet.props.children[1].type.should.equal('input');
    profileUrlFieldSet.props.children[1].props.defaultValue.should.equal('profileUrl');
    profileUrlFieldSet.props.children[1].props.id.should.equal('profileUrl');
    profileUrlFieldSet.props.children[1].props.name.should.equal('profileUrl');
    profileUrlFieldSet.props.children[2].type.displayName.should.equal('ErrorsList');

    var emailFieldSet = form.props.children[5];
    emailFieldSet.type.should.equal('fieldset');
    emailFieldSet.props.children[0].type.should.equal('label');
    emailFieldSet.props.children[1].type.should.equal('input');
    emailFieldSet.props.children[1].props.defaultValue.should.equal('email');
    emailFieldSet.props.children[1].props.id.should.equal('email');
    emailFieldSet.props.children[1].props.name.should.equal('email');
    emailFieldSet.props.children[2].type.displayName.should.equal('ErrorsList');

    var profileTextFieldSet = form.props.children[6];
    profileTextFieldSet.type.should.equal('fieldset');
    profileTextFieldSet.props.children[0].type.should.equal('label');
    profileTextFieldSet.props.children[1].type.should.equal('textarea');
    profileTextFieldSet.props.children[1].props.defaultValue.should.equal('profileText');
    profileTextFieldSet.props.children[1].props.id.should.equal('profileText');
    profileTextFieldSet.props.children[1].props.name.should.equal('profileText');
    profileTextFieldSet.props.children[2].type.displayName.should.equal('ErrorsList');

    var allErrors = form.props.children[7];
    allErrors.type.displayName.should.equal('ErrorsList');

    var submitButton = form.props.children[8];
    submitButton.type.should.equal('button');
    submitButton.props.type.should.equal('submit');
    submitButton.props.children.props.message.should.equal('submit');
  });

  it('should render errors', function() {
    var intl = i10n.getIntl();
    var form = createComponent(UserFormComponent, {
      locales: intl.locales,
      messages: intl.messages,
      section: 'create',
      proto: 'user',
      username: 'username',
      fullname: 'fullname',
      profileUrl: 'profileUrl',
      email: 'email',
      profileText: 'profileText',
      body: {},
      errors: {'username': ['this is an error']}
    });

    var usernameFieldSet = form.props.children[0];
    usernameFieldSet.type.should.equal('fieldset');
    var userErrors = usernameFieldSet.props.children[2];
    userErrors.type.displayName.should.equal('ErrorsList');
    userErrors.props.errors[0].should.equal('this is an error');
  });
});
