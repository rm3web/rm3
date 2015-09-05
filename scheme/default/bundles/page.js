// Load and use polyfill for ECMA-402.
if (!global.Intl) {
  global.Intl = require('intl');
}

var React = require('react');
var PageFormComponent = require('../partials/page.jsx');

var block = formData.block;

var root = formData.path;

var title = formData.title;
var abstract = formData.abstract;

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