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
      var chunk = {}, context = {}, params = {predClass: 'tag', predKey: 'plain'};
      chunk.write = function(str) {
        str.should.equal('');
        cb();
      };
      context.get = function(param) {
        return params[param];
      };

      dust.helpers.predTag(chunk, context, {}, params);
    });

    it('works for predicates', function(cb) {
      var chunk = {}, context = {}, params = {predClass: 'boof', predKey: 'foof'};
      chunk.write = function(str) {
        str.should.equal('foof:boof');
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
      var params = {predClass: 'tag', predKey: 'plain', objKey: 'woof'};
      context.resolve = function(param) {
        return param;
      };
      chunk.write = function(str) {
        str.should.equal('<a href="/tags.html/$/woof">woof</a>');
        cb();
      };
      context.get = function(param) {
        return params[param];
      };

      dust.helpers.objLink(chunk, context, {}, params);
    });

    it('works for predicates', function(cb) {
      var chunk = {}, context = {};
      var params = {predClass: 'boof', predKey: 'foof', objKey: 'woof'};
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
