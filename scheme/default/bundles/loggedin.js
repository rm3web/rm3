// Load and use polyfill for ECMA-402.
if (!global.Intl) {
  global.Intl = require('intl');
}

var url = require('url');
var path = url.parse(window.location.href);
var apiPath = path.protocol + "//" + path.host;

var React = require('react');
var ReactDOM = require('react-dom');
var MenuButtonComponent = require('../partials/menubutton.jsx');
var gearRenderTarget = document.getElementById('gearmenu');
var protoRenderTarget = document.getElementById('protomenu');
var MenuButtonFactory = React.createFactory(MenuButtonComponent);
var ApiClient = require('../../../lib/apiclient');

if (gearRenderTarget) {
  var actions = [];

  if (permissions.hasOwnProperty('post.delete')) {
    actions.push({url: baseurl + 'delete.html', label: 'DELETE', confirm: true});
  }

  if (permissions.hasOwnProperty('view')) {
    actions.push({url: baseurl + 'tree.html', label: 'TREE'});
  }

  if (permissions.hasOwnProperty('post.edit')) {
    actions.push({func: function() {
      var apiClient = new ApiClient(apiPath);
      apiClient.page(baseurl).toggleNavbar().end(function(err, res) {
        return location.reload(true);
      });
    }, label: 'NAVBAR'});
    actions.push({func: function() {
      var apiClient = new ApiClient(apiPath);
      apiClient.page(baseurl).toggleHidden().end(function(err, res) {
        return location.reload(true);
      });
    }, label: 'HIDDEN'});
  }

  var gearComponent = ReactDOM.render(
    MenuButtonFactory({
      locales: intl.locales,
      messages: intl.messages,
      section: section,
      actions: actions,
      label: 'GEAR'
    }),
    gearRenderTarget
  );
}

if (protoRenderTarget) {
  var protoList = [];

  for (var proto in protos) {
    if (protos.hasOwnProperty(proto)) {
      protoList.push({
        url: '/$new' + baseurl + 'create.html?type=' + proto,
        label: protos[proto].desc
      });
    }
  }

  var renderedComponent = ReactDOM.render(
    MenuButtonFactory({
      locales: intl.locales,
      messages: intl.messages,
      section: section,
      actions: protoList,
      label: 'CREATE'
    }),
    protoRenderTarget
  );
}
