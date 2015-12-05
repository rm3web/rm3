var React = require('react');
var CommentFormComponent = require('../partials/comment.jsx');

var renderTarget = document.getElementById('commentbutton');
var PathFactory = React.createFactory(CommentFormComponent);

var renderedComponent = React.render(
  PathFactory({
    locales: intl.locales,
    messages: intl.messages,
    csrfToken: csrfToken,
    commentPath: commentPath
  }),
  renderTarget
);