var should = require('should');
var SitePath = require ('sitepath');
var ApiClient = require('../../lib/apiclient');

describe('crud', function() {
  it('works', function(cb) {
    var client = new ApiClient('http://127.0.0.1:4000');
    client.page('/').get().end(function(err, res) {
      if (err) {
        console.log(err);
        should.fail();
      }
      res.body.summary.should.eql({title: 'Welcome to rm3', abstract: 'Welcome to rm3'});
      res.body.data.posting.blocks.length.should.eql(2);
      res.body.data.posting.blocks[1].format.should.equal('html');
      cb();
    });
  });
});
