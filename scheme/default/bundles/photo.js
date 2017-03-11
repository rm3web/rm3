// Load and use polyfill for ECMA-402.
if (!global.Intl) {
  global.Intl = require('intl');
}

var React = require('react');
var ReactDOM = require('react-dom');
var PhotoFormComponent = require('../partials/photo.jsx');

var block = formData.block;
var root = formData.path;

var title = formData.title;
var abstract = formData.abstract;

var renderTarget = document.getElementById('pageform');
var PathFactory = React.createFactory(PhotoFormComponent);

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
    block: block,
    proto: 'user',
    proto: proto,
    errors: errors,
    isDraft: isDraft,
    privateBlobstore: privateBlobstore,
    revisionId: revisionId
  }),
  renderTarget
);
