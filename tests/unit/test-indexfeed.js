var IndexFeed = require ('../../lib/indexfeed');
var should = require('should');
var SitePath = require ('../../lib/sitepath');
var events = require("events");

describe('indexfeed', function() {
  describe('#resultsToIndexFeed', function() {
    var ee, now, output;
    beforeEach(function() {
      var protoset = {};
      protoset.decorateListing = function(article, scheme) {
        return article;
      };
      now = new Date();
      ee = new events.EventEmitter();
      output = IndexFeed.resultsToIndexFeed(protoset, {}, {}, ee);
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
    });

    it('should pass end', function(cb) {
      output.on('end', function() {
        cb();
      });
      ee.emit('end');
    });

    it('should pass errors', function(cb) {
      var protoset = {};
      protoset.decorateListing = function(article, scheme) {
        return article;
      };
      var ee = new events.EventEmitter();
      var output = IndexFeed.resultsToIndexFeed(protoset, {}, {}, ee);
      var err = new Error('mockingboard');
      output.on('error', function(e) {
        e.should.equal(err);
        cb();
      });
      ee.emit('error', err);
    });
  });
});
