var Scheme = require ('../../lib/scheme');
var should = require('chai').should();
var path = require('path');

describe('scheme', function() {
  it('should work as expected', function(cb) {
    var scheme = new Scheme(path.join(__dirname, '../../scheme/default/'), {}, {}, {});
    scheme.getResourcePath('node').should.equal('/resources/node');
    var context = {};
    context.scheme = scheme;
    context.errortitle = 'error title';
    context.errordata = 'error data';
    scheme.renderSync('error', context, function(err, str) {
      if (err) {
        console.log(err);
        should.fail(err);
        return cb(err);
      }
      str.should.equal('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Error: error title</title><link rel="stylesheet" href="/resources/bundle.css"></head><body><h1>Error: error title</h1><code>error data</code></div></body></html>');
      cb(err);
    });
  });
});
