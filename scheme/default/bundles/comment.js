var React = require('react');
var ReactDOM = require('react-dom');
var CommentFormComponent = require('../partials/comment.jsx');

var renderTarget = document.getElementById('commentbutton');
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
