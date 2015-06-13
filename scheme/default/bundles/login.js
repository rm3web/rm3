var React = require('react');
var LoginFormComponent = require('../partials/login.jsx');

var renderTarget = document.getElementById('loginform');
var LoginFactory = React.createFactory(LoginFormComponent);

var renderedComponent = React.render(
  LoginFactory({
    locales: intl.locales,
    messages: intl.messages
  }),
  renderTarget
);