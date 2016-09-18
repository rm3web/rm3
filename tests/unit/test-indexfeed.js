var IndexFeed = require ('../../lib/indexfeed');
var should = require('should');
var SitePath = require ('sitepath');
var events = require("events");

describe('indexfeed', function() {
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
});
