var React = require('react/addons');
require("babel-register");
var TestUtils = React.addons.TestUtils;
var createComponent = require('../lib/create-component');
var JsxForms = require('../../lib/jsx_forms.jsx');
var i10n = require('../../lib/i10n');
var SitePath = require ('../../lib/sitepath');

describe('PathNameComponent', function() {
  it('should render with no leaf set', function() {
    var intl = i10n.getIntl();
    var form = createComponent(JsxForms.PathNameComponent, {
      locales: intl.locales,
      messages: intl.messages,
      path: 'wh.cookie'
    });

    form.type.should.equal('fieldset');

    var rootInput = form.props.children[0].props.children;
    rootInput.type.should.equal('input');
    rootInput.props.value.should.equal('wh.cookie');

    var leafInput = form.props.children[1].props.children;
    leafInput.type.should.equal('input');
    leafInput.props.disabled.should.equal(true);

    var checkInput = form.props.children[2].props.children;
    checkInput.props.children[0].props.checked.should.equal(true);
  });

  it('should render with leaf set', function() {
    var intl = i10n.getIntl();
    var form = createComponent(JsxForms.PathNameComponent, {
      locales: intl.locales,
      messages: intl.messages,
      path: 'wh.cookie',
      leaf: 'chocolate'
    });

    form.type.should.equal('fieldset');

    var rootInput = form.props.children[0].props.children;
    rootInput.type.should.equal('input');
    rootInput.props.value.should.equal('wh.cookie');

    var leafInput = form.props.children[1].props.children;
    leafInput.type.should.equal('input');
    leafInput.props.disabled.should.equal(false);
    leafInput.props.value.should.equal('chocolate');

    var checkInput = form.props.children[2].props.children;
    checkInput.props.children[0].props.checked.should.equal(false);
  });

  it('should render with SitePath instead of string', function() {
    var intl = i10n.getIntl();
    var form = createComponent(JsxForms.PathNameComponent, {
      locales: intl.locales,
      messages: intl.messages,
      path: new SitePath(['wh', 'cookie'])
    });

    form.type.should.equal('fieldset');

    var rootInput = form.props.children[0].props.children;
    rootInput.type.should.equal('input');
    rootInput.props.value.should.equal('wh.cookie');

    var leafInput = form.props.children[1].props.children;
    leafInput.type.should.equal('input');
    leafInput.props.disabled.should.equal(true);

    var checkInput = form.props.children[2].props.children;
    checkInput.props.children[0].props.checked.should.equal(true);
  });
});

describe('SingleError', function() {
  it('should render', function() {
    var intl = i10n.getIntl();
    var form = createComponent(JsxForms.SingleError, {
      error: 'stuff went wrong'
    });

    form.type.should.equal('li');
    form.props.children.should.equal('stuff went wrong');
  });
});

describe('ErrorsList', function() {
  it('should render an empty list', function() {
    var intl = i10n.getIntl();
    var form = createComponent(JsxForms.ErrorsList, {
      errors: []
    });

    form.type.should.equal('div');
  });

  it('should render', function() {
    var intl = i10n.getIntl();
    var form = createComponent(JsxForms.ErrorsList, {
      errors: ['stuff went wrong']
    });

    form.type.should.equal('div');
    var errorList = form.props.children;
    errorList.type.should.equal('ul');
    var singleError = errorList.props.children[0];
    singleError.type.displayName.should.equal('SingleError');
    singleError.props.error.should.equal('stuff went wrong');
    singleError.key.should.equal('0');
  });
});
