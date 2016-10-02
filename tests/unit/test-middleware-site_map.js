var siteMap = require('../../lib/middleware/site_map');
var should = require('chai').should();
var util = require('util');

describe('middleware:contextCreate', function() {
  var mockDb = {'postgres': true};
  var mockData = {
    site: {"name": "My Little Pony Fansite"},
    sitepath: {"root": "wh", "urlroot": "http://www.example.com/"},
    login: {"visible": false}
  };
  var query = {};
  query.getSiteConfig = function(db, ctx, site, path, next) {
    db.should.eql(mockDb);
    site.should.eql('default');
    mockData.should.contain.all.keys(path);
    next(null, mockData[path]);
  };
  var middleware = siteMap(mockDb, query);
  middleware.should.be.a("function");
  var req, res;

  beforeEach(function() {
    req = {};
    res = {};
  });

  it('should work', function(cb) {
    middleware(req, res, function() {
      req.should.have.keys('site');
      req.site.name.should.equal('My Little Pony Fansite');
      req.site.root.toDottedPath().should.equal('wh');
      req.site.urlroot.should.equal('http://www.example.com/');
      req.site.loginVisible.should.equal(false);
      req.site.sitePathToUrl(req.site.root).should.equal('/');
      cb();
    });
  });
});
