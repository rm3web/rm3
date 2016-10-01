var SiteHelpers = require ('../../lib/sitehelpers');
var SitePath = require ('sitepath');
var should = require('chai').should();

describe('sitehelpers', function() {
  var dust, db, query;

  beforeEach(function() {
    dust = {helpers: {}};
    db = {};
    query = {};
    SiteHelpers.installDust(dust, db, query);
  });

  describe('#sitePathToUrl', function() {
    it('works for sitepaths', function(cb) {
      var chunk = {}, context = {}, params = {path: new SitePath(['wh'])};
      chunk.write = function(str) {
        str.should.equal('moonlight princesses');
        cb();
      };
      context.resolve = function(param) {
        param.should.equal(params.path);
        return param;
      };
      context.get = function(param) {
        param.should.equal('site');
        return {sitePathToUrl: function(path) {
          return 'moonlight princesses';
        }};
      };

      dust.helpers.sitePathToUrl(chunk, context, {}, params);
    });
    it('works (degeneratively) for strings', function(cb) {
      var chunk = {}, context = {}, params = {path: 'space kittens'};
      chunk.write = function(str) {
        str.should.equal('space kittens');
        cb();
      };
      context.resolve = function(param) {
        param.should.equal(params.path);
        return param;
      };
      context.get = function(param) {
        param.should.equal('site');
        return {sitePathToUrl: function(path) {
          should.fail();
        }};
      };

      dust.helpers.sitePathToUrl(chunk, context, {}, params);
    });
  });
});
