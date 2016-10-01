var ActivityFeed = require ('../../lib/activityfeed');
var should = require('chai').should();
var SitePath = require ('sitepath');
var events = require("events");

describe('activityfeed', function() {
  describe('#logToActivityFeed', function() {
    var ee, now, output, site;
    beforeEach(function() {
      site = {};
      site.name = "WireWorld";
      site.sitePathToUrl = function(sitepath) {
        return sitepath.toUrl('/', 1);
      };
      now = new Date();
      ee = new events.EventEmitter();
      output = ActivityFeed.logToActivityFeed(ee, site);
      output.on('error', function(err) {
        should.fail();
      });
    });

    it('should handle actor users', function(cb) {
      var r = {
        entityId: 'uuid1234',
        note: 'note 13',
        baseRevisionId: 'uuid111',
        replaceRevisionId: null,
        revisionId: 'uuid13566',
        revisionNum: 1,
        evtStart: now,
        evtEnd: now,
        evtTouched: now,
        evtClass: 'post',
        evtFinal: true,
        actorPath:  new SitePath(['wh', 'midnight', 'kitty']),
        path: new SitePath(['wh', 'sunlit', 'pony']),
        data: {},
        actorProto: 'user',
        actorSummary: {'title': 'Midnight Kitty'},
        objProto: 'page',
        objSummary: {'title': 'Sunlit Ponies!'}
      };

      output.on('article', function(rec) {
        rec.should.contain.all.keys(['object', '@type', 'updated', 'startTime',
          'endTime', '@id', 'published', 'actor']);
        rec.object.url.should.equal('/sunlit/pony/?revisionId=uuid13566');
        rec.object.displayName.should.equal('Sunlit Ponies!');
        rec.object['rm3:proto'].should.equal('page');
        rec['@type'].should.equal('post');
        rec.updated.should.equal(now);
        rec['@id'].should.equal('urn:uuid13566:1');
        rec.actor.should.contain.all.keys('@type', '@id', 'url');
        rec.actor['@type'].should.equal('Person');
        rec.actor.url.should.equal('/midnight/kitty/');
        rec.actor['rm3:proto'].should.equal('user');
        rec.actor.displayName.should.equal('Midnight Kitty');
        cb();
      });

      ee.emit('article', r);
    });

    it('should handle non-final messages', function(cb) {
      var r = {
        entityId: 'uuid1234',
        note: 'note 13',
        baseRevisionId: 'uuid111',
        replaceRevisionId: null,
        revisionId: 'uuid13566',
        revisionNum: 1,
        evtStart: now,
        evtEnd: now,
        evtTouched: now,
        evtClass: 'post',
        evtFinal: false,
        actorPath:  new SitePath(['wh', 'midnight', 'kitty']),
        path: new SitePath(['wh', 'sunlit', 'pony']),
        data: {}
      };

      output.on('article', function(rec) {
        rec.should.contain.all.keys(['object', '@type', 'updated', 'startTime',
          'endTime', '@id', 'actor']);
        rec.should.not.have.all.keys(['published']);
        rec.object.url.should.equal('/sunlit/pony/?revisionId=uuid13566');
        rec['@type'].should.equal('post');
        rec.updated.should.equal(now);
        rec['@id'].should.equal('urn:uuid13566:1');
        rec.actor.should.have.all.keys('@type', '@id', 'url');
        rec.actor['@type'].should.equal('Person');
        rec.actor.url.should.equal('/midnight/kitty/');
        cb();
      });

      ee.emit('article', r);
    });

    it('should handle actor users', function(cb) {
      var r = {
        entityId: 'uuid1234',
        note: 'note 13',
        baseRevisionId: 'uuid111',
        replaceRevisionId: null,
        revisionId: 'uuid13566',
        revisionNum: 1,
        evtStart: now,
        evtEnd: now,
        evtTouched: now,
        evtClass: 'post',
        evtFinal: true,
        actorPath: 'root',
        path: new SitePath(['wh', 'sunlit', 'pony']),
        data: {}
      };

      output.on('article', function(rec) {
        rec.should.contain.all.keys(['object', '@type', 'updated', 'startTime',
          'endTime', '@id', 'published', 'actor']);
        rec.object.url.should.equal('/sunlit/pony/?revisionId=uuid13566');
        rec['@type'].should.equal('post');
        rec.updated.should.equal(now);
        rec['@id'].should.equal('urn:uuid13566:1');
        rec.actor['@type'].should.equal('http://rm3.wirewd.com/Site');
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
      var ee = new events.EventEmitter();
      var output = ActivityFeed.logToActivityFeed(ee);
      var err = new Error('mockingbird');
      output.on('error', function(e) {
        e.should.equal(err);
        cb();
      });
      ee.emit('error', err);
    });
  });

  describe('helpers', function() {
    var dust, db, query;

    beforeEach(function() {
      dust = {helpers: {}};
      db = {};
      query = {};
      ActivityFeed.installDust(dust, db, query);
    });

    describe('#activityActor', function() {
      var chunk, context, params;

      beforeEach(function() {
        chunk = {};
        context = {};
        params = {key: 'blah'};
      });

      var tests = [
        {desc: 'returns a string if given a string',
        input: 'long noses',
        output: 'long noses'},
        {desc: 'returns root',
        input: {'@type': 'http://rm3.wirewd.com/Site'},
        output: 'root'},
        {desc: 'returns an id and URL',
        input: {url: 'url', '@id': 'id'},
        output: '<a href="url">id</a>'},
        {desc: 'returns a displayName and URL',
        input: {url: 'url', '@id': 'id', displayName: 'pony'},
        output: '<a href="url">pony</a>'},
        {desc: 'returns an id',
        input: {'@id': 'sad_id'},
        output: 'sad_id'},
        {desc: 'handles complete unknown situations',
        input: {},
        output: 'unknown'}
      ];

      tests.forEach(function(test, index) {
        it(test.desc, function(cb) {
          chunk.write = function(str) {
            str.should.equal(test.output);
            cb();
          };
          context.resolve = function(param) {
            param.should.equal('blah');
            return test.input;
          };
          dust.helpers.activityActor(chunk, context, {}, params);
        });
      });
    });

    describe('#activityObject', function() {
      var chunk, context, params;

      beforeEach(function() {
        chunk = {};
        context = {};
        params = {key: 'blah'};
      });

      var tests = [
        {desc: 'returns a string if given a string',
        input: 'screwball humor',
        output: 'screwball humor'},
        {desc: 'returns an id and URL',
        input: {url: 'url', '@id': 'id'},
        output: '<a href="url">id</a>'},
        {desc: 'returns a displayName and URL',
        input: {url: 'url', '@id': 'id', displayName: 'kitten'},
        output: '<a href="url">kitten</a>'},
        {desc: 'returns an id',
        input: {'@id': 'sad_id'},
        output: 'sad_id'},
        {desc: 'handles complete unknown situations',
        input: {},
        output: 'unknown object'}
      ];

      tests.forEach(function(test, index) {
        it(test.desc, function(cb) {
          chunk.write = function(str) {
            str.should.equal(test.output);
            cb();
          };
          context.resolve = function(param) {
            param.should.equal('blah');
            return test.input;
          };
          dust.helpers.activityObject(chunk, context, {}, params);
        });
      });
    });

    describe('#activityVerb', function() {
      it('works', function(cb) {
        var chunk = {}, context = {}, params = {};
        chunk.write = function(str) {
          str.should.equal('screwball humor');
          cb();
        };
        context.get = function(param) {
          param.should.equal('@type');
          return 'screwball humor';
        };

        dust.helpers.activityVerb(chunk, context, {}, params);
      });
    });

    describe('#activityId', function() {
      it('works', function(cb) {
        var chunk = {}, context = {}, params = {};
        chunk.write = function(str) {
          str.should.equal('the id goes here');
          cb();
        };
        context.get = function(param) {
          param.should.equal('rm3:revisionId');
          return 'the id goes here';
        };

        dust.helpers.activityId(chunk, context, {}, params);
      });
    });

    describe('#activityBareUrl', function() {
      it('works', function(cb) {
        var chunk = {}, context = {}, params = {};
        chunk.write = function(str) {
          str.should.equal('http://example.com');
          cb();
        };
        context.get = function(param) {
          param.should.equal('object');
          return {'rm3:rootUrl': 'http://example.com'};
        };

        dust.helpers.activityBareUrl(chunk, context, {}, params);
      });
    });
  });
});
