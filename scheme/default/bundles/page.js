// Load and use polyfill for ECMA-402.
if (!global.Intl) {
  global.Intl = require('intl');
}

var React = require('react');
var PageFormComponent = require('../partials/page.jsx');

var numblocks = document.getElementById('numblocks');
var block;

function fetchBlock(prefix) {
  var format = document.getElementById(prefix + "[format]").value;
  if (format === 'pragma') {
    var query = document.getElementById(prefix + "[query]").value;
    return {query: query, format: format};
  } else if (format === 'html') {
    var source = document.getElementById(prefix + "[source]").innerHTML;
    return {htmltext: source, format: format};
  } else {
    var source = document.getElementById(prefix + "[source]").innerHTML;
    return {source: source, format: format};
  }
}

if (numblocks) {
  var blocks = [];
  for(var i = 0; i < numblocks.value; ++i) {
    var prefix = 'posting[blocks][' + i + ']'
    blocks.push(fetchBlock(prefix));
  }
  block = {format: 'section', blocks: blocks};
} else {
  block = fetchBlock('posting');
}

var root, slug;
if (section !== 'edit') {
  root = document.getElementById('root').value;
  slug = document.getElementById('slug').value;
}
var title = document.getElementById('title').innerHTML;
var abstract = document.getElementById('abstract').innerHTML;

var renderTarget = document.getElementById('pageform');
var PathFactory = React.createFactory(PageFormComponent);

var renderedComponent = React.render(
  PathFactory({
    locales: intl.locales,
    messages: intl.messages,
    section: section,
    path: root,
    title: title,
    abstract: abstract,
    proto: 'user',
    block: block,
    proto: proto,
    errors: {}
  }),
  renderTarget
);