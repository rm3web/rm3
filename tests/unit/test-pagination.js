var SitePath = require ('sitepath');
var Pagination = require ('../../lib/pagination');
var should = require('should');
var events = require("events");

describe('pagination', function() {
  describe('#generatePagination', function() {
    it('generates a null for no params', function() {
      var pagination = Pagination.generatePagination();
      pagination.should.deepEqual({});
    });

    it('generates a value when a size is given', function() {
      var pagination = Pagination.generatePagination(10);
      pagination.should.deepEqual({limit: 11, start:0});
    });
  });

  describe('#parsePath', function() {
    it('works when partial = null', function() {
      var pagination = {};
      Pagination.parsePath(pagination, '1235', undefined, function(a,b) {should.fail();});
      pagination.should.deepEqual({});
    });
    it('works for simple count partials', function() {
      var pagination = {};
      Pagination.parsePath(pagination, 'g', ['g', '14'], function(a,b) {should.fail();});
      pagination.should.deepEqual({start: 14});
    });
    it('works for more complicated count partials', function() {
      var pagination = {};
      Pagination.parsePath(pagination, 'g', ['g', '14_a'],
        function(pagination, memento) {
          memento.should.deepEqual(['14', 'a']);
          pagination.zzz = '12';
        });
      pagination.should.deepEqual({start: 14, zzz: '12'});
    });
  });

  describe('#generatePageLink', function() {
    it('works', function() {
      var k = Pagination.generatePageLink('gr', {start: 14, limit: 10}, ['ff']);
      k.should.equal('gr/23_ff/');
    });
  });

  describe('#generateLastLink', function() {
    var ee;
    beforeEach(function() {
      ee = new events.EventEmitter();
    });

    it('passes errors', function(cb) {
      var pe = Pagination.generateLastLink(ee,{});
      pe.on('error', function(err) {
        err.should.equal('123');
        cb();
      });
      ee.emit('error', '123');
    });

    it('passes unmodified articles and detect if there is more', function(cb) {
      var pe = Pagination.generateLastLink(ee,{limit:2});
      var passed = false;
      pe.on('error', function(err) {
        should.fail();
      });
      pe.on('more', function(lastArt) {
        if (lastArt) {
          should.fail();
        }
      });
      pe.on('article', function(data) {
        data.should.equal('123');
        passed = true;
      });
      pe.on('end', function() {
        passed.should.equal(true);
        cb();
      });
      ee.emit('article', '123');
      ee.emit('end');
    });

    it('passes unmodified articles and a more link', function(cb) {
      var pe = Pagination.generateLastLink(ee,{limit:2});
      pe.on('error', function(err) {
        should.fail();
      });
      pe.on('more', function(lastArt) {
        lastArt.should.equal('123');
      });
      pe.on('end', function() {
        cb();
      });
      ee.emit('article', '123');
      ee.emit('article', '32');
      ee.emit('end');
    });
  });
});
