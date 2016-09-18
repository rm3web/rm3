// Load and use polyfill for ECMA-402.
if (!global.Intl) {
  global.Intl = require('intl');
}

var url = require('url');
var path = url.parse(window.location.href);
var apiPath = path.protocol + "//" + path.host;

require("babel-polyfill");

var React = require('react');
var ReactDOM = require('react-dom');
var TagPageComponent = require('../partials/tag.jsx');

var renderTarget = document.getElementById('tags');
var PathFactory = React.createFactory(TagPageComponent);

var renderedComponent = ReactDOM.render(
  PathFactory({
    locales: intl.locales,
    messages: intl.messages,
    baseurl: baseurl,
    apiPath: apiPath,
  }),
  renderTarget
);