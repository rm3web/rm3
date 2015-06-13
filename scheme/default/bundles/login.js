var React = require('react');
var MyComponent = require('../partials/login.jsx');

var renderTarget = document.getElementById('loginform');
var LoginFactory = React.createFactory(MyComponent);

var renderedComponent = React.render(
  LoginFactory({
    locales: intl.locales,
    messages: intl.messages
  }),
  renderTarget
);