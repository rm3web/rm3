/* global casper */
/*jshint expr:true */

describe('History', function() {
  before(function() {
    casper.start('http://127.0.0.1:4000/');
  });

  after(function() {
    casper.thenOpen('http://127.0.0.1:4000/$logout/');
  });

  it('should be viewable', function() {
    casper.then(function() {
      'Welcome to rm3'.should.matchTitle;
      'a[href*=history]'.should.be.inDOM.and.be.visible;
      'a[href*=history]'.should.contain.text('History');
      'div.footer'.should.be.inDOM.and.be.visible;
      'body > div.pure-g > div.pure-u-2-3 > h1'.should.contain.text('Welcome to rm3');
      this.click('a[href*=history]');
    });

    casper.then(function() {
      'Welcome to rm3'.should.matchTitle;
      'div.footer'.should.be.inDOM.and.be.visible;
      'div.pure-u-2-3 > h1'.should.contain.text('History');
      'div.pure-u-2-3 > table > tbody > tr > td'.should.contain.text('post');
      'div.pure-u-2-3 > table > tbody > tr > td'.should.contain.text('loaded via rm3load');
    });
  });
});
