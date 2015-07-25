var ActivityFeed = require ('../../lib/activityfeed');
var should = require('should');
var SitePath = require ('../../lib/sitepath');
var events = require("events");

describe('activityfeed', function() {
  describe('#logToActivityFeed', function() {
    var ee, now, output;
    beforeEach(function() {
      now = new Date();
      ee = new events.EventEmitter();
      output = ActivityFeed.logToActivityFeed(ee);
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
        actorPath: 'wh.midnight.kitty',
        path: new SitePath(['wh', 'sunlit', 'pony']),
        data: {}
      };

      output.on('article', function(rec) {
        rec.should.have.properties(['object', 'verb', 'updated', 'startTime',
          'endTime', 'id', 'published', 'actor']);
        rec.object.url.should.equal('/sunlit/pony');
        rec.verb.should.equal('post');
        rec.updated.should.equal(now);
        rec.id.should.equal('urn:uuid13566:1');
        rec.actor.should.have.properties('objectType', 'id', 'url');
        rec.actor.objectType.should.equal('person');
        rec.actor.url.should.equal('/midnight/kitty');
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
        actorPath: 'wh.midnight.kitty',
        path: new SitePath(['wh', 'sunlit', 'pony']),
        data: {}
      };

      output.on('article', function(rec) {
        rec.should.have.properties(['object', 'verb', 'updated', 'startTime',
          'endTime', 'id', 'actor']);
        rec.should.not.have.properties(['published']);
        rec.object.url.should.equal('/sunlit/pony');
        rec.verb.should.equal('post');
        rec.updated.should.equal(now);
        rec.id.should.equal('urn:uuid13566:1');
        rec.actor.should.have.properties('objectType', 'id', 'url');
        rec.actor.objectType.should.equal('person');
        rec.actor.url.should.equal('/midnight/kitty');
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
        rec.should.have.properties(['object', 'verb', 'updated', 'startTime',
          'endTime', 'id', 'published', 'actor']);
        rec.object.url.should.equal('/sunlit/pony');
        rec.verb.should.equal('post');
        rec.updated.should.equal(now);
        rec.id.should.equal('urn:uuid13566:1');
        rec.actor.objectType.should.equal('site');
        cb();
      });

      ee.emit('article', r);
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
        input: {url: 'url', id: 'id'},
        output: '<a href="url">id</a>'},
        {desc: 'returns an id',
        input: {id: 'sad_id'},
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
        var chunk = {}, context = {}, params = {key: 'blah'};
        chunk.write = function(str) {
          str.should.equal('screwball humor');
          cb();
        };
        context.resolve = function(param) {
          param.should.equal('blah');
          return 'screwball humor';
        };

        dust.helpers.activityVerb(chunk, context, {}, params);
      });
    });
  });

});
