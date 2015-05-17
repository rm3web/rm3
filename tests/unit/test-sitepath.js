var sitepath = require ('../../lib/sitepath');
var should = require('should');

describe('sitepath', function() {
  describe('creation', function() {
    it('works', function() {
      var p = new sitepath(['wh', 'hat']);
      var p2 = new sitepath(['bleh', 'test'], ['test']);

      should.deepEqual(p.path, ['wh', 'hat']);
      should.deepEqual(p2.path, ['bleh', 'test']);
      should.deepEqual(p2.partial, ['test']);
    });
  });

  describe('#fromDottedPath()', function() {
    it('works', function() {
      var p = new sitepath();
      var p2 = new sitepath();
      p.fromDottedPath();
      p2.fromDottedPath('wh.bleh');

      should.deepEqual(p.path, []);
      should.deepEqual(p2.path, ['wh', 'bleh']);
    });
  });
  describe('#jsonSerialize()', function() {
    it('works', function() {
      var p = new sitepath(['wh', 'hat'], ['test']);

      should.deepEqual(p.jsonSerialize(), ['wh', 'hat']);
    });
  });

  describe('#toUrl()', function() {
    it('works', function() {
      var p = new sitepath(['wh', 'hat']);

      should.deepEqual(p.toUrl('http://www.wirewd.com/'),
      'http://www.wirewd.com/wh/hat');

      should.deepEqual(p.toUrl('http://www.wirewd.com/', 1),
      'http://www.wirewd.com/hat');

      should.deepEqual(p.toUrl('/'),
      '/wh/hat');
    });
  });

  describe('#toDottedPath()', function() {
    it('works', function() {
      var p = new sitepath(['wh', 'hat']);

      should.deepEqual(p.toDottedPath(),
      'wh.hat');

    });
  });

  describe('#up()', function() {
    it('works', function() {

      var p = new sitepath(['wh', 'hat']);
      var p2 = new sitepath(['wh']);

      should.deepEqual(p.up(), p2);
    });
  });

  describe('#fromUrlSegment()', function() {
    it('works', function() {

      var p = new sitepath();
      p.fromUrlSegment('/wh/suck');
      should.deepEqual(p.path, ['wh', 'suck']);
      var p2 = new sitepath();
      p2.fromUrlSegment('/wh/suck/');
      should.deepEqual(p2.path, ['wh', 'suck']);
    });
    it('works with a prefix', function() {
      var p = new sitepath();

      p.fromUrlSegment('/suck', ['wh']);
      should.deepEqual(p.path, ['wh', 'suck']);
    });
    it('works with a bad segment', function() {
      var p = new sitepath();

      p.fromUrlSegment('//suck///');
      should.deepEqual(p.path, ['suck']);
    });
    it('works with a file path', function() {
      var p = new sitepath();

      p.fromUrlSegment('/suck/blah.html');
      should.deepEqual(p.path, ['suck']);
      should.deepEqual(p.page, 'blah.html');
    });
    it('works with a partial', function() {
      var p = new sitepath();

      p.fromUrlSegment('/suck/$/offset/15');
      should.deepEqual(p.path, ['suck']);
      should.deepEqual(p.page, null);
      should.deepEqual(p.partial, '/offset/15');

      p.fromUrlSegment('/suck/blah.txt/$/offset/15');
      should.deepEqual(p.path, ['suck']);
      should.deepEqual(p.page, 'blah.txt');
      should.deepEqual(p.partial, '/offset/15');
    });
    it('throws when there\'s an invalid string', function() {
      var p = new sitepath();

      (function() {
        p.fromUrlSegment('/suck/bla-.html');
      }).should.throw('validation error');
    });
  });

  describe('#down()', function() {
    it('works', function() {
      var p = new sitepath(['wh', 'hat']);
      var p2 = new sitepath(['wh']);

      should.deepEqual(p2.down('hat'), p);
    });
  });

});
