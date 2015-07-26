var React = require('react/addons');
require('node-jsx').install({extension: '.jsx'});
var TestUtils = React.addons.TestUtils;
var createComponent = require('../lib/create-component');
var JsxForms = require('../../lib/jsx_forms.jsx');
var i10n = require('../../lib/i10n');

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
    checkInput.props.children[0].props.defaultChecked.should.equal(true);
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
    leafInput.props.defaultValue.should.equal('chocolate');

    var checkInput = form.props.children[2].props.children;
    checkInput.props.children[0].props.defaultChecked.should.equal(false);
  });
});
