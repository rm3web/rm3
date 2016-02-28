var TagHelpers = require ('../../lib/taghelpers');
var should = require('should');
var events = require("events");

describe('taghelpers', function() {
  var dust, db, query;

  beforeEach(function() {
    dust = {helpers: {}};
    db = {};
    query = {};
    TagHelpers.installDust(dust, db, query);
  });

  describe('#predTag', function() {
    it('works for plain tags', function(cb) {
      var chunk = {}, context = {}, params = {obj: {objClass: 'tag'}, pred: 'plain'};
      context.resolve = function(param) {
        return param;
      };
      chunk.write = function(str) {
        str.should.equal('plain');
        cb();
      };
      context.get = function(param) {
        return params[param];
      };

      dust.helpers.predTag(chunk, context, {}, params);
    });

    it('works for predicates', function(cb) {
      var chunk = {}, context = {}, params = {obj: {objClass: 'boof'}, pred: 'foof'};
      context.resolve = function(param) {
        return param;
      };
      chunk.write = function(str) {
        str.should.equal('<a href="/search.cgi/$/tag/foof">foof</a>');
        cb();
      };
      context.get = function(param) {
        return params[param];
      };

      dust.helpers.predTag(chunk, context, {}, params);
    });
  });

  describe('#objLink', function() {
    it('works for plain tags', function(cb) {
      var chunk = {}, context = {};
      var params = {obj: {objClass: 'tag'}, pred: 'plain', objKey: 'woof'};
      context.resolve = function(param) {
        return param;
      };
      chunk.write = function(str) {
        str.should.equal('<a href="/search.cgi/$/tag/plain/woof">woof</a>');
        cb();
      };
      context.get = function(param) {
        return params[param];
      };

      dust.helpers.objLink(chunk, context, {}, params);
    });

    it('works for predicates', function(cb) {
      var chunk = {}, context = {};
      var params = {obj: {objClass: 'boof'}, pred: 'foof', objKey: 'woof'};
      context.resolve = function(param) {
        return param;
      };
      chunk.write = function(str) {
        str.should.equal('woof');
        cb();
      };
      context.get = function(param) {
        return params[param];
      };

      dust.helpers.objLink(chunk, context, {}, params);
    });
  });

});
