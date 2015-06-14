var React = require('react');
var UserFormComponent = require('../partials/user.jsx');

var renderTarget = document.getElementById('userform');
var UserFactory = React.createFactory(UserFormComponent);

var renderedComponent = React.render(
  UserFactory({
    locales: intl.locales,
    messages: intl.messages,
    section: section
    /*,
    username: username,
    fullname: fullname,
    profileUrl: profileUrl,
    email: email,
    profileText: profileText
    */
  }),
  renderTarget
);