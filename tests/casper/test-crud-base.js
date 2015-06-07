/* global casper */
/* global expect */
/*jshint expr:true */

describe('Base type CRUD', function() {
  before(function() {
    casper.start('http://127.0.0.1:4000/');
  });

  after(function() {
    casper.thenOpen('http://127.0.0.1:4000/$logout');
  });

  it('should CRUD', function() {
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
      this.click('a[data-dropdown*=dropdown]');
    });

    casper.then(function() {
      this.click('a[href*=base]');
    });

    casper.then(function() {
      'div.footer'.should.be.inDOM.and.be.visible;
      this.fill('form[action*=create]',
        {title: 'CasperJS Test',
         'posting[source]': 'post data here do stuff etc'}, true);
    });

    casper.then(function() {
      expect(casper.currentHTTPStatus).to.equal(200);
      this.click('a[href*=casperjs_test]');
    });

    casper.then(function() {
      'div.footer'.should.be.inDOM.and.be.visible;
      'div.pure-u-2-3'.should.contain.text('post data here do stuff etc');
      this.click('a[href*=edit]');
    });

    casper.then(function() {
      'div.footer'.should.be.inDOM.and.be.visible;
      'textarea[name=posting\\[source\\]]'.should.be.inDOM.and.be.visible;
      this.click('#addText');
    });

    casper.then(function() {
      this.fill('form[action*=edit]',
        {'posting[blocks][0][source]': '# edited\n\ndid some stuff',
         'posting[blocks][0][format]': 'markdown',
         'posting[blocks][1][source]': '<strong>html stuff</strong>',
         'posting[blocks][1][format]': 'html'}, true);
    });

    casper.then(function() {
      'div.footer'.should.be.inDOM.and.be.visible;
      'textarea[name=posting\\[blocks\\]\\[1\\]\\[source\\]]'.should.be.inDOM.and.be.visible;
    });

    casper.thenOpen('http://127.0.0.1:4000/casperjs_test/', function() {
      'div.footer'.should.be.inDOM.and.be.visible;
      'div.pure-u-2-3 h1'.should.contain.text('edited');
      'div.pure-u-2-3'.should.contain.text('did some stuff');
      'div.pure-u-2-3'.should.contain.text('html stuff');
      //this.click('a[href*=casperjs_test/delete]');
    });

    casper.thenOpen('http://127.0.0.1:4000/casperjs_test/delete.html?sure=yes', function() {
      'div.footer'.should.be.inDOM.and.be.visible;
      'div.infomessage'.should.be.inDOM.and.contain.text('Page deleted');
    });
  });
});
