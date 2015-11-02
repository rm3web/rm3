var React = require('react');
var UserFormComponent = require('../partials/user.jsx');

var renderTarget = document.getElementById('userform');
var UserFactory = React.createFactory(UserFormComponent);

var username = document.getElementById('username').value;
var fullname = document.getElementById('fullname').value;
var profileUrl = document.getElementById('profileUrl').value;
var email = document.getElementById('email').value;
var profileText = document.getElementById('profileText').innerHTML;
var disableLogin = document.getElementById('disableLogin').checked;

if (!window.hasOwnProperty('errors')) {
  errors = {}
}

var renderedComponent = React.render(
  UserFactory({
    locales: intl.locales,
    messages: intl.messages,
    section: section,
    proto: 'user',
    username: username,
    fullname: fullname,
    profileUrl: profileUrl,
    email: email,
    profileText: profileText,
    disableLogin: disableLogin,
    body: {},
    errors: errors
  }),
  renderTarget
);