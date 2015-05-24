/* global casper */
/*jshint expr:true */

describe('User', function() {
  beforeEach(function() {
    casper.start('http://127.0.0.1:4000/');
  });

  after(function() {
    casper.thenOpen('http://127.0.0.1:4000/$logout');
  });

  it('should reject bad passwords', function() {
    casper.then(function() {
      'Welcome to rm3'.should.matchTitle;
      'a[href*=login]'.should.be.inDOM.and.be.visible;
      'div.footer'.should.be.inDOM.and.be.visible;
      this.click('a[href*=login]');
    });

    casper.then(function() {
      'form[action*=login]'.should.be.inDOM.and.be.visible;
      'div.footer'.should.be.inDOM.and.be.visible;
      this.fill('form[action*=login]',
        {username: 'wirehead',
         password: 'pass'}, true);
    });

    casper.then(function() {
      'form[action*=login]'.should.be.inDOM.and.be.visible;
      'div.errormessage'.should.be.inDOM.and.contain.text('Error: Password Validation failed');
      'div.footer'.should.be.inDOM.and.be.visible;
    });
  });


  it('should reject invalid accounts', function() {
    casper.then(function() {
      'Welcome to rm3'.should.matchTitle;
      'a[href*=login]'.should.be.inDOM.and.be.visible;
      'div.footer'.should.be.inDOM.and.be.visible;
      this.click('a[href*=login]');
    });

    casper.then(function() {
      'form[action*=login]'.should.be.inDOM.and.be.visible;
      'div.footer'.should.be.inDOM.and.be.visible;
      this.fill('form[action*=login]',
        {username: 'sparkleprincess',
         password: 'pass'}, true);
    });

    casper.then(function() {
      'form[action*=login]'.should.be.inDOM.and.be.visible;
      'div.errormessage'.should.be.inDOM.and.contain.text('Error: Password Validation failed');
      'div.footer'.should.be.inDOM.and.be.visible;
    });
  });


  it('should be able to log in and out', function() {
    casper.then(function() {
      'Welcome to rm3'.should.matchTitle;
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
      'a[href*=logout]'.should.be.inDOM.and.be.visible;
      'div.infomessage'.should.be.inDOM.and.contain.text('You have been logged in');
      'div.footer'.should.be.inDOM.and.be.visible;
      this.click('a[href*=logout]');
    });

    casper.then(function() {
      'a[href*=login]'.should.be.inDOM.and.be.visible;
      'div.footer'.should.be.inDOM.and.be.visible;
    });
  });
});
