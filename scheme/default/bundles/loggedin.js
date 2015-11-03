// Load and use polyfill for ECMA-402.
if (!global.Intl) {
  global.Intl = require('intl');
}

var React = require('react');
var MenuButtonComponent = require('../partials/menubutton.jsx');
var gearRenderTarget = document.getElementById('gearmenu');
var protoRenderTarget = document.getElementById('protomenu');
var MenuButtonFactory = React.createFactory(MenuButtonComponent);

if (gearRenderTarget) {
  var actions = [];

  if (permissions.hasOwnProperty('delete')) {
    actions.push({url: baseurl+'delete.html', label: 'DELETE', confirm: true});
  }

  var gearComponent = React.render(
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

  for(var proto in protos) {
    if (protos.hasOwnProperty(proto)) {
      protoList.push({
        url: '/$new' + baseurl + 'create.html?type=' + proto,
        label: protos[proto].desc
      })
    }
  }

  var renderedComponent = React.render(
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