var IndexFeed = require ('../../lib/indexfeed');
var should = require('chai').should();
var SitePath = require ('sitepath');
var events = require("events");

describe('indexfeed', function() {
  describe('#parseFacetPath', function() {
    it('works for no partial', function() {
      var filter = {};
      var facet = IndexFeed._parseFacetPath([], 'index', filter);
      facet.should.equal(false);
    });

    it('works for predicate', function() {
      var filter = {};
      var facet = IndexFeed._parseFacetPath(['index_pred', 'plain', ''], 'index', filter);
      facet.should.equal(true);
      filter.predicate.should.equal('plain');
    });

    it('works for tag', function() {
      var filter = {};
      var facet = IndexFeed._parseFacetPath(['index_tag', 'foo', ''], 'index', filter);
      facet.should.equal(true);
      filter.tag.should.equal('foo');
    });

    it('works for yearmonth', function() {
      var filter = {};
      var facet = IndexFeed._parseFacetPath(['index_yearmonth', '2017_1', ''], 'index', filter);
      facet.should.equal(true);
      filter.yearMonth.should.eql(new Date(2017,0,1));
    });
  });

  describe('#generateFacetLink', function() {
    var site = {};

    beforeEach(function() {
      site.sitePathToUrl = function(sitepath) {
        return 'fq';
      };
    });

    it('generates a key for date facets', function() {
      var row = {facet: new Date(1995, 11, 17, 3, 24, 0)};
      var out = IndexFeed._generateFacetLink(row, true, 'f', 'q', site, {}, 'changed');
      out.should.equal('fq$/f_q/1995_12/');
    });

    it('generates a key for tag facets', function() {
      var row = {facet: 'goo'};
      var out = IndexFeed._generateFacetLink(row, false, 'f', 'q', site, {}, 'changed');
      out.should.equal('fq$/f_q/goo/');
    });
  });

  describe('#authorLink', function() {

    var dust, db, query, chunk, str, contextData, context;

    beforeEach(function() {
      dust = {helpers: {}};
      db = {};
      query = {};
      context = {};
      contextData = {};
      str = '';

      context.get = function(key) {
        return contextData[key];
      };

      chunk = {};
      chunk.write = function(instr) {
        str = str + instr;
      };
      IndexFeed.installDust(dust, db, query);
    });

    it('should handle a default author', function() {
      contextData.author = 'pink bunny';
      dust.helpers.authorLink(chunk, context, {}, {});
      str.should.equal('pink bunny');
    });

    it('should handle a better author', function() {
      contextData.author = 'pink bunny';
      contextData['meta.atom:author.name'] = 'purple pony';
      dust.helpers.authorLink(chunk, context, {}, {});
      str.should.equal('purple pony');
    });

    it('should handle a better link', function() {
      contextData.author = 'pink bunny';
      contextData['meta.atom:author.uri'] = 'http://www.example.com/';
      dust.helpers.authorLink(chunk, context, {}, {});
      str.should.equal('<a href="http://www.example.com/">pink bunny</a>');
    });
  });

  describe('#resultsToIndexFeed', function() {
    var ee, now, output;
    beforeEach(function() {
      var protoset = {};
      protoset.decorateListing = function(ctx, article, dbRow, scheme, site, blobstore, next) {
        next(null, article);
      };
      now = new Date();
      ee = new events.EventEmitter();
      output = IndexFeed.resultsToIndexFeed({}, protoset, {}, {}, {}, ee);
      output.on('error', function(err) {
        should.fail();
      });
    });

    it('should handle actor users', function(cb) {
      var r = {
        path: new SitePath(['wh']),
        stub: false,
        entityId: 'f5f2e2e0-57cf-11e4-bca4-e7af6fd7ffe4',
        revisionId: 'f5f2e2e1-57cf-11e4-bca4-e7af6fd7ffe4',
        revisionNum: 1,
        proto: 'base',
        modified: new Date(),
        created: new Date(),
        summary: {title: 'blrg', abstract: 'some text goes here'},
        data: {posting: '<div></div>'}
      };

      output.on('article', function(rec) {
        rec.meta['rm3:proto'].should.equal('base');
        rec.title.should.equal('blrg');
        rec.summary.should.equal('some text goes here');
        rec.guid.should.equal(r.entityId);
        rec.pubdate.should.equal(r.created);
        rec.date.should.equal(r.modified);
        rec.path.should.equal(r.path);
        cb();
      });

      ee.emit('article', r);
      ee.emit('end', r);
    });

    it('should pass end', function(cb) {
      output.on('end', function() {
        cb();
      });
      ee.emit('end');
    });

    it('should pass errors', function(cb) {
      var protoset = {};
      protoset.decorateListing = function(ctx, article, dbRow, scheme, site, blobstore, next) {
        next(null, article);
      };
      var ee = new events.EventEmitter();
      var output = IndexFeed.resultsToIndexFeed({}, protoset, {}, {}, {}, ee);
      var err = new Error('mockingboard');
      output.on('error', function(e) {
        e.should.equal(err);
        cb();
      });
      ee.emit('error', err);
    });
  });

  describe('#mostRecentChange', function() {

    var dust, db, query, chunk, str, contextData, context, now;

    beforeEach(function() {
      dust = {helpers: {}};
      db = {};
      query = {};
      context = {};
      contextData = {};
      str = '';
      now = new Date();

      context.get = function(key) {
        return contextData[key];
      };

      chunk = {};
      chunk.write = function(instr) {
        str = str + instr;
      };

      chunk.map = function(func) {
        func(chunk);
      };

      query.fetchMostRecentChange = function(db, cache, ctx, path, next) {
        next(null, now);
      };

      IndexFeed.installDust(dust, db, {}, query);
    });

    it('should handle a default author', function(cb) {
      chunk.end = function() {
        str.should.equal(now.toISOString());
        cb();
      };

      dust.helpers.mostRecentChange(chunk, context, {}, {});
    });
  });

});
