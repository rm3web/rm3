var React = require('react/addons');
require('node-jsx').install({extension: '.jsx'});
var TestUtils = React.addons.TestUtils;
var createComponent = require('../lib/create-component');
var JsxForms = require('../../lib/jsx_forms.jsx');
var i10n = require('../../lib/i10n');
var SitePath = require ('../../lib/sitepath');

describe('TextBlockComponent', function() {
  it('should render a textblock when blank', function() {
    var intl = i10n.getIntl();
    var form = createComponent(JsxForms.TextBlockComponent, {
      locales: intl.locales,
      messages: intl.messages,
      prefix: 'plastic_makes_perfect'
    });

    form.type.should.equal('fieldset');

    var textarea = form.props.children[0];
    textarea.type.should.equal('textarea');
    textarea.props.rows.should.equal('30');
    textarea.props.name.should.equal('plastic_makes_perfect[source]');
    textarea.props.className.should.equal('pure-input-1');

    var select = form.props.children[1];
    select.type.should.equal('select');
    select.props.name.should.equal('plastic_makes_perfect[format]');

    select.props.children[0].type.should.equal('option');
    select.props.children[0].props.value.should.equal('html');
    select.props.children[0].props.children.should.equal('HTML');
    select.props.children[1].type.should.equal('option');
    select.props.children[1].props.value.should.equal('markdown');
    select.props.children[1].props.children.should.equal('Markdown');
  });

  it('should render a single markdown textblock', function() {
    var intl = i10n.getIntl();
    var form = createComponent(JsxForms.TextBlockComponent, {
      locales: intl.locales,
      messages: intl.messages,
      prefix: 'plastic_makes_perfect',
      block: {format: 'markdown', source: '# get'}
    });

    form.type.should.equal('fieldset');

    var textarea = form.props.children[0];
    textarea.type.should.equal('textarea');
    textarea.props.rows.should.equal('30');
    textarea.props.name.should.equal('plastic_makes_perfect[source]');
    textarea.props.className.should.equal('pure-input-1');
    textarea.props.defaultValue.should.equal('# get');

    var select = form.props.children[1];
    select.type.should.equal('select');
    select.props.name.should.equal('plastic_makes_perfect[format]');

    select.props.children[0].type.should.equal('option');
    select.props.children[0].props.value.should.equal('html');
    select.props.children[0].props.children.should.equal('HTML');
    select.props.children[1].type.should.equal('option');
    select.props.children[1].props.value.should.equal('markdown');
    select.props.children[1].props.children.should.equal('Markdown');
    select.props.defaultValue.should.equal('markdown');
  });

  it('should render a single html textblock', function() {
    var intl = i10n.getIntl();
    var form = createComponent(JsxForms.TextBlockComponent, {
      locales: intl.locales,
      messages: intl.messages,
      prefix: 'plastic_makes_perfect',
      block: {htmltext:"<strong>html section</strong>",
        format:"html"}
    });

    form.type.should.equal('fieldset');

    var textarea = form.props.children[0];
    textarea.type.should.equal('textarea');
    textarea.props.rows.should.equal('30');
    textarea.props.name.should.equal('plastic_makes_perfect[source]');
    textarea.props.className.should.equal('pure-input-1');
    textarea.props.defaultValue.should.equal('<strong>html section</strong>');

    var select = form.props.children[1];
    select.type.should.equal('select');
    select.props.name.should.equal('plastic_makes_perfect[format]');

    select.props.children[0].type.should.equal('option');
    select.props.children[0].props.value.should.equal('html');
    select.props.children[0].props.children.should.equal('HTML');
    select.props.children[1].type.should.equal('option');
    select.props.children[1].props.value.should.equal('markdown');
    select.props.children[1].props.children.should.equal('Markdown');
    select.props.defaultValue.should.equal('html');
  });

  it('should render a list of textblocks', function() {
    var intl = i10n.getIntl();
    var form = createComponent(JsxForms.TextBlockComponent, {
      locales: intl.locales,
      messages: intl.messages,
      prefix: 'plastic_makes_perfect',
      block: {"blocks":
      [{source:"# humans make good pets",
        htmltext:"<h1>humans make good pets</h1>",
        format:"markdown"},
        {htmltext:"<strong>html section</strong>",
        format:"html"}],
      format:"section"}
    });

    form.type.should.equal('fieldset');

    var section = form.props.children[0];
    section.props.type.should.equal('hidden');
    section.props.name.should.equal('plastic_makes_perfect[format]');

    var numblocks = form.props.children[1];
    numblocks.props.type.should.equal('hidden');
    numblocks.props.name.should.equal('numblocks');
    numblocks.props.value.should.equal(2);

    var blocklist = form.props.children[2];
    blocklist[0].type.displayName.should.equal('TextBlockComponent');
    blocklist[0].props.prefix.should.equal('plastic_makes_perfect[blocks][0]');
    blocklist[0].props.block.should.have.properties({source:"# humans make good pets",
        htmltext:"<h1>humans make good pets</h1>",
        format:"markdown"});
    blocklist[0].key.should.equal('0');

    blocklist[1].type.displayName.should.equal('TextBlockComponent');
    blocklist[1].props.prefix.should.equal('plastic_makes_perfect[blocks][1]');
    blocklist[1].props.block.should.have.properties({htmltext:"<strong>html section</strong>",
        format:"html"});
    blocklist[1].key.should.equal('1');
  });
});

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
    checkInput.props.children[0].props.defaultChecked.should.equal(true);
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
