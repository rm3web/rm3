// hat tip to:
// http://simonsmith.io/unit-testing-react-components-without-a-dom/
var React = require('react/addons');
var TestUtils = React.addons.TestUtils;

function createComponent(component, props) {
  var shallowRenderer = TestUtils.createRenderer();
  shallowRenderer.render(React.createElement(component, props));
  return shallowRenderer.getRenderOutput();
}

module.exports = exports = createComponent;
