var should = require('should');
var SitePath = require ('sitepath');
var ApiClient = require('../../lib/apiclient');

describe('tags', function() {
  it('works', function(cb) {
    var client = new ApiClient('http://127.0.0.1:4000');
    client.page('/').allowedTags().end(function(err, res) {
      if (err) {
        console.log(err);
        should.fail();
      }
      console.log(res.body);
      cb();
    });
  });
});
