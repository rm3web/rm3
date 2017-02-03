/* global casper */
/* global expect */
/*jshint expr:true */

describe('Blog index type CRUD', function() {
  before(function() {
    casper.start('http://127.0.0.1:4000/');

    // http://stackoverflow.com/questions/25359247/casperjs-bind-issue
    // This polyfill hacks around the lack of ES5 in PhantomJS 1.x
    // and CasperJS 1.1beata4.
    // At some point in the future, it can go, but it breaks function.bind
    // right now.
    casper.on('page.initialized', function() {
      this.evaluate(function() {
        var isFunction = function(o) {
          return typeof o == 'function';
        };

        var bind, slice = [].slice, proto = Function.prototype, featureMap;

        featureMap = {
          'function-bind': 'bind'
        };

        function has(feature) {
          var prop = featureMap[feature];
          return isFunction(proto[prop]);
        }

        // check for missing features
        if (!has('function-bind')) {
          // adapted from Mozilla Developer Network example at
          // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
          bind = function bind(obj) {
            var args = slice.call(arguments, 1);
            var self = this;
            var nop = function() { };
            var bound = function() {
              return self.apply(this instanceof nop ? this : (obj || {}), args.concat(slice.call(arguments)));
            };
            nop.prototype = this.prototype || {}; // Firefox cries sometimes if prototype is undefined
            bound.prototype = new nop();
            return bound;
          };
          proto.bind = bind;
        }
      });
    });
  });

  after(function() {
    casper.thenOpen('http://127.0.0.1:4000/$logout/');
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

    casper.wait(100);

    casper.then(function() {
      'a[href*=logout]'.should.be.inDOM.and.be.visible;
      'div.infomessage'.should.be.inDOM.and.contain.text('You have been logged in');
      'div.footer'.should.be.inDOM.and.be.visible;
      this.click('#protomenu .pure-button');
    });

    /*
    casper.then(function() {
      this.click('#PROTO_BASE');
    });
    */
    casper.thenOpen('http://127.0.0.1:4000/$new/create.html?type=blogindex', function() {
      'div.footer'.should.be.inDOM.and.be.visible;
      this.fill('form[action*=create]',
        {title: 'Blog Index Test',
          'posting[source]': 'post data here do stuff etc'}, true);
    });

    casper.wait(100);

    casper.then(function() {
      expect(casper.currentHTTPStatus).to.equal(200);
      'div.footer'.should.be.inDOM.and.be.visible;
      'div.pure-u-2-3'.should.contain.text('post data here do stuff etc');
      this.click('a[href*=edit]');
    });

    casper.waitUntilVisible('#addText', function() {
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
    });

    casper.thenOpen('http://127.0.0.1:4000/blog_index_test/', function() {
      'div.footer'.should.be.inDOM.and.be.visible;
      'div.pure-u-2-3 h1'.should.contain.text('edited');
      'div.pure-u-2-3'.should.contain.text('did some stuff');
      'div.pure-u-2-3'.should.contain.text('html stuff');
      this.fill('form[action*=quickcreate]',
        {'title': 'blogy blog',
          'posting': 'postingy'}, true);
    });

    casper.thenOpen('http://127.0.0.1:4000/blog_index_test/', function() {
      'div.footer'.should.be.inDOM.and.be.visible;
      'div.pure-u-2-3 h1'.should.contain.text('edited');
      'div.pure-u-2-3'.should.contain.text('did some stuff');
      'div.pure-u-2-3'.should.contain.text('html stuff');
      'div.pure-u-2-3'.should.contain.text('blogy blog');
    });

    casper.thenOpen('http://127.0.0.1:4000/blog_index_test/blogy_blog/', function() {
      'div.footer'.should.be.inDOM.and.be.visible;
      'div.pure-u-2-3'.should.contain.text('postingy');
      'div.pure-u-2-3'.should.contain.text('blogy blog');
    });

    casper.thenOpen('http://127.0.0.1:4000/blog_index_test/delete.html?sure=yes', function() {
      'div.footer'.should.be.inDOM.and.be.visible;
      'div.infomessage'.should.be.inDOM.and.contain.text('Page deleted');
    });
  });
});
