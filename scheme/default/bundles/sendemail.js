var React = require('react');
var ReactDOM = require('react-dom');
var CommentFormComponent = require('../partials/sendemail.jsx');

var renderTarget = document.getElementById('emailbutton');
var PathFactory = React.createFactory(CommentFormComponent);

var renderedComponent = ReactDOM.render(
  PathFactory({
    locales: intl.locales,
    messages: intl.messages,
    csrfToken: csrfToken,
    commentPath: commentPath,
    userPath: userPath
  }),
  renderTarget
);
