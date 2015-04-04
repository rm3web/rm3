var Conf = require ('../../lib/conf');
var should = require('should');

describe('conf', function() {
  it('should work as expected', function () {
    // dummy test: make this better when conf develops

    var conString = Conf.get_endpoint('postgres');

    conString.should.be.equal('postgresql://wirehead:rm3test@127.0.0.1/rm3test');
  });
});
