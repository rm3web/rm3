var createDOMPurify = require('dompurify');
var jsdom = require('jsdom');
var window = jsdom.jsdom('', {
  features: {
    FetchExternalResources: false, // disables resource loading over HTTP / filesystem
    ProcessExternalResources: false // do not execute JS within script blocks
  }
}).defaultView;
var DOMPurify = createDOMPurify(window);

/**
* @overview A little bit of form error-handling utilities
* @title FormLib
* @module formlib
*/

exports.sanitizeXML = function sanitizeXML(data) {
  return DOMPurify.sanitize(data);
};
