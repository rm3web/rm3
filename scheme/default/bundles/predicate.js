// Load and use polyfill for ECMA-402.
if (!global.Intl) {
  global.Intl = require('intl');
}

var React = require('react');
var ReactDOM = require('react-dom');
var PredicateFormComponent = require('../partials/predicate.jsx');

var root = formData.path;

var title = formData.title;
var abstract = formData.abstract;
var uri = formData.uri;

var renderTarget = document.getElementById('pageform');
var PathFactory = React.createFactory(PredicateFormComponent);

if (!window.hasOwnProperty('errors')) {
  errors = {};
}

if (!window.hasOwnProperty('isDraft')) {
  isDraft = false;
  revisionId = false;
}

var renderedComponent = ReactDOM.render(
  PathFactory({
    locales: intl.locales,
    messages: intl.messages,
    section: section,
    path: root,
    title: title,
    abstract: abstract,
    uri: uri,
    proto: 'predicate',
    proto: proto,
    errors: errors,
    isDraft: isDraft,
    revisionId: revisionId
  }),
  renderTarget
);
