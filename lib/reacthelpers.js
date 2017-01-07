var SitePath = require ('sitepath');
var React = require('react');
var ReactDOM = require('react-dom/server');
var requireCompiled = require('require-compiled').babelOptions({"presets": ["react", "es2015"]});
var path = require('path');

var renderComponentToString = function renderComponent(reactDirs, file, props) {
  var component = requireCompiled(path.resolve(path.join(reactDirs[0], file)));
  var factory = React.createFactory(component);
  return ReactDOM.renderToString(factory(props));
};

/**
 * Install Dust helpers for React
 * @param {*} dust Dust instance
 * @param {*} db Database instance
 * @param {*} query Query instance
 * @param {*} reactDirs React module directories
 */
function installDust(dust, db, query, reactDirs) {
  dust.helpers.reactForm = function(chunk, context, bodies, params) {
    try {
      var file = context.resolve(params.component);
      var div = context.resolve(params.div);

      var scheme = context.get('scheme');

      var intlData = context.get('intl');
      var bundlePath = context.resolve(params.bundle);
      var bundle = scheme.getResourcePath(bundlePath);

      var revisionId = context.get('meta.revisionId');
      var isDraft = context.get('isDraft');
      var formData = context.get('formData');
      var errors = context.get('errors');
      var proto = context.get('meta.proto');
      var section = context.get('section');

      var props = {};

      for (var element in formData) {
        if (formData.hasOwnProperty(element)) {
          props[element] = formData[element];
        }
      }

      props.locales = intlData.locales;
      props.messages = intlData.messages;
      props.revisionId = revisionId;
      props.isDraft = isDraft;
      props.errors = errors;
      props.proto = proto;
      props.section = section;

      var markup = renderComponentToString(reactDirs, file, props);

      chunk.write('<div id="' + div + '">' + markup + '</div>' +
                '<script src="' + bundle + '"></script>');
      return chunk;
    } catch (e) {
      chunk.setError(e);
      console.log(e);
      console.log(e.stack);
    }
  };
}

exports.installDust = installDust;
