// Load and use polyfill for ECMA-402.
if (!global.Intl) {
  global.Intl = require('intl');
}

var React = require('react');
var ReactDOM = require('react-dom');
var VectorGraphicFormComponent = require('../partials/vectorgraphic.jsx');

var root = formData.path;

var title = formData.title;
var abstract = formData.abstract;

var renderTarget = document.getElementById('pageform');
var PathFactory = React.createFactory(VectorGraphicFormComponent);

if (!window.hasOwnProperty('errors')) {
  errors = {}
}

var renderedComponent = ReactDOM.render(
  PathFactory({
    locales: intl.locales,
    messages: intl.messages,
    section: section,
    path: root,
    title: title,
    abstract: abstract,
    proto: 'user',
    proto: proto,
    errors: errors
  }),
  renderTarget
);