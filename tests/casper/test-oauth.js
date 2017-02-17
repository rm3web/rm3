/* global casper */
/*jshint expr:true */

describe('OAuth', function() {
  beforeEach(function() {
    casper.start('http://127.0.0.1:4000/$logout/');
    'a[href*=login]'.should.be.inDOM.and.be.visible;
    'div.footer'.should.be.inDOM.and.be.visible;
  });

  after(function() {
    casper.thenOpen('http://127.0.0.1:4000/$logout/');
  });

  it('should work', function() {
    casper.thenOpen('http://127.0.0.1:9000/');

    casper.then(function() {
      'a[href*=auth]'.should.be.inDOM.and.be.visible;
      this.click('a[href*=auth]');
    });
    casper.then(function() {
      'a[href*=login]'.should.be.inDOM.and.be.visible;
      'div.footer'.should.be.inDOM.and.be.visible;
      this.click('a[href*=login]');
    });
    casper.then(function() {
      'form[action*=login]'.should.be.inDOM.and.be.visible;
      'div.footer'.should.be.inDOM.and.be.visible;
      this.fill('form[action*=login]',
        {username: 'wirehead',
          password: 'password'}, true);
    });
    casper.then(function() {
      this.click('#allow');
    });
    casper.then(function() {
      'pre'.should.contain.text('access_token');
      'pre'.should.contain.text('Bearer');
    });

    casper.thenOpen('http://127.0.0.1:4000/');
    casper.then(function() {
      'a[href*=logout]'.should.be.inDOM.and.be.visible;
      'div.footer'.should.be.inDOM.and.be.visible;
      this.click('a[href*=logout]');
    });

    casper.then(function() {
      'a[href*=login]'.should.be.inDOM.and.be.visible;
      'div.footer'.should.be.inDOM.and.be.visible;
    });
  });
});
