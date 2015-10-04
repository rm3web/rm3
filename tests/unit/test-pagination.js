var SitePath = require ('../../lib/sitepath');
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
});
