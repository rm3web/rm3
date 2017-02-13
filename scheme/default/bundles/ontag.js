// Load and use polyfill for ECMA-402.
if (!global.Intl) {
  global.Intl = require('intl');
}

var React = require('react');
var ReactDOM = require('react-dom');
var OntagFormComponent = require('../partials/ontag.jsx');

var root = formData.path;

var title = formData.title;
var abstract = formData.abstract;
var uri = formData.uri;
var properties = formData.properties;

var renderTarget = document.getElementById('pageform');
var PathFactory = React.createFactory(OntagFormComponent);

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
    proto: 'ontag',
    proto: proto,
    errors: errors,
    properties: properties,
    isDraft: isDraft,
    revisionId: revisionId
  }),
  renderTarget
);
