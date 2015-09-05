var React = require('react/addons');
require('node-jsx').install({extension: '.jsx'});
var TestUtils = React.addons.TestUtils;
var createComponent = require('../lib/create-component');
var TextBlockComponent = require('../../lib/textblocks_forms.jsx').TextBlockComponent;
var i10n = require('../../lib/i10n');

describe('TextBlockComponent', function() {
  it('should render a textblock when blank', function() {
    var intl = i10n.getIntl();
    var form = createComponent(TextBlockComponent, {
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
    var form = createComponent(TextBlockComponent, {
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
    textarea.props.value.should.equal('# get');

    var select = form.props.children[1];
    select.type.should.equal('select');
    select.props.name.should.equal('plastic_makes_perfect[format]');

    select.props.children[0].type.should.equal('option');
    select.props.children[0].props.value.should.equal('html');
    select.props.children[0].props.children.should.equal('HTML');
    select.props.children[1].type.should.equal('option');
    select.props.children[1].props.value.should.equal('markdown');
    select.props.children[1].props.children.should.equal('Markdown');
    select.props.valueLink.value.should.equal('markdown');
  });

  it('should render a single html textblock', function() {
    var intl = i10n.getIntl();
    var form = createComponent(TextBlockComponent, {
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
    textarea.props.value.should.equal('<strong>html section</strong>');

    var select = form.props.children[1];
    select.type.should.equal('select');
    select.props.name.should.equal('plastic_makes_perfect[format]');

    select.props.children[0].type.should.equal('option');
    select.props.children[0].props.value.should.equal('html');
    select.props.children[0].props.children.should.equal('HTML');
    select.props.children[1].type.should.equal('option');
    select.props.children[1].props.value.should.equal('markdown');
    select.props.children[1].props.children.should.equal('Markdown');
    select.props.valueLink.value.should.equal('html');
  });

  it('should render a list of textblocks', function() {
    var intl = i10n.getIntl();
    var form = createComponent(TextBlockComponent, {
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

    var blocklist = form.props.children[1];
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
