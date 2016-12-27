var SiteHelpers = require ('../../lib/sitehelpers');
var SitePath = require ('sitepath');
var should = require('chai').should();
var proxyquire =  require('proxyquire');
var dust = require('dustjs-linkedin');

var dustRender = function(template, templateName, vars, match, cb) {
  var trueTemplate = dust.compile(template, templateName);
  dust.loadSource(trueTemplate);
  dust.render(templateName, vars, function(err, output) {
    if (err) {
      should.fail();
    } else {
      output.should.equal(match);
    }
    cb(err);
  });
};

describe('sitehelpers', function() {
  var confStub = {};
  before(function() {
    var proxy = proxyquire('../../lib/sitehelpers', {'./conf': confStub});
    proxy.installDust(dust, {}, {});
  });

  describe('#siteUrlRoot', function() {
    var siteTemplate = "{@siteUrlRoot /}";
    it('works', function(cb) {
      dustRender(siteTemplate , 'sitehelpers.siteurlroot', {site: {urlroot: 'lof'}}, 'lof', cb);
    });
  });

  describe('#ifLoginEnabled', function() {
    it('works for a sitepath', function(cb) {
      var trueTemplate = "{@ifLoginEnabled}works{:else}bro{/ifLoginEnabled}";
      dustRender(trueTemplate, 'sitehelpers.thirdlevel.sitepath', {site: {loginVisible: true}}, 'works', cb);
    });
    it('works', function(cb) {
      var trueTemplate = "{@ifLoginEnabled}bro{:else}works{/ifLoginEnabled}";
      dustRender(trueTemplate, 'sitehelpers.thirdlevel.else', {site: {loginVisible: false}}, 'works', cb);
    });
  });

  describe('#toDottedPath', function() {
    var dottedPathTemplate = "{myInput|toDottedPath}";
    it('works for a sitepath', function(cb) {
      dustRender(dottedPathTemplate , 'sitehelpers.dottedpath', {myInput: new SitePath(['wh','ff'])}, 'wh.ff', cb);
    });
    it('ignores everything else', function(cb) {
      dustRender(dottedPathTemplate , 'sitehelpers.dottedpath', {myInput: '51'}, '51', cb);
    });
  });

  describe('#onlyThirdLevel', function() {
    it('works for a sitepath', function(cb) {
      var trueTemplate = "{@onlyThirdLevel}works{:else}bro{/onlyThirdLevel}";
      dustRender(trueTemplate, 'sitehelpers.thirdlevel.sitepath', {path: new SitePath(['wh','ff','tt'])}, 'works', cb);
    });
    it('works', function(cb) {
      var trueTemplate = "{@onlyThirdLevel}bro{:else}works{/onlyThirdLevel}";
      dustRender(trueTemplate, 'sitehelpers.thirdlevel.else', {path: new SitePath(['wh','ff'])}, 'works', cb);
    });
  });

  describe('#sitePathToUrl', function() {
    var dust, db, query;

    beforeEach(function() {
      dust = {helpers: {}, filters: {}};
      db = {};
      query = {};
      SiteHelpers.installDust(dust, db, query);
    });

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

  describe('#hasAuthProviderEnabled', function() {
    it('works for Twitter', function(cb) {
      confStub.getCertificate = function(certificate) {
        if (certificate === 'twitterConsumerKey') {
          return 'abcd';
        }
        return undefined;
      };
      var trueTemplate = "{@hasAuthProviderEnabled provider=\"twitter\"}works{:else}brok{/hasAuthProviderEnabled}";
      dustRender(trueTemplate, 'sitehelpers.auth.twitter', {}, 'works', cb);
    });

    it('works for Twitter', function(cb) {
      confStub.getCertificate = function(certificate) {
        return undefined;
      };
      var trueTemplate = "{@hasAuthProviderEnabled provider=\"twitter\"}brok{:else}works{/hasAuthProviderEnabled}";
      dustRender(trueTemplate, 'sitehelpers.auth.notwitter', {}, 'works', cb);
    });
  });
});
