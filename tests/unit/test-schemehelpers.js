var SchemeHelpers = require ('../../lib/schemehelpers');
var SitePath = require ('../../lib/sitepath');
var should = require('should');

describe('schemehelpers', function() {
  var dust, db, query;

  beforeEach(function() {
    dust = {helpers: {}};
    db = {};
    query = {};
    SchemeHelpers.installDust(dust, db, query);
  });

  describe('#schemeStaticResource', function() {
    it('works', function(cb) {
      var chunk = {}, context = {}, params = {path: 'unicorns.css'};
      chunk.write = function(str) {
        str.should.equal('horned warriors');
        cb();
      };
      context.resolve = function(param) {
        param.should.equal(params.path);
        return param;
      };
      context.get = function(param) {
        param.should.equal('scheme');
        return {getResourcePath: function(path) {
          path.should.equal(params.path);
          return 'horned warriors';
        }};
      };

      dust.helpers.schemeStaticResource(chunk, context, {}, params);
    });
  });
});
