/* global casper */
/*jshint expr:true */

describe('Tags', function() {
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

  it('should render correctly', function() {
    casper.then(function() {
      // Index page type
      'Welcome to rm3'.should.matchTitle;
      'a[href*=login]'.should.be.inDOM.and.be.visible;
      'div.footer'.should.be.inDOM.and.be.visible;
      this.click('a[href*=login]');
    });

    casper.waitUntilVisible('form[action*=login]', function() {
      'div.footer'.should.be.inDOM.and.be.visible;
      this.fill('form[action*=login]',
        {username: 'wirehead',
          password: 'password'}, true);
    });

    casper.wait(300);

    casper.then(function() {
      'a[href*=logout]'.should.be.inDOM.and.be.visible;
      'div.infomessage'.should.be.inDOM.and.contain.text('You have been logged in');
      'div.footer'.should.be.inDOM.and.be.visible;
      this.click('a[href*=tag]');
    });

    casper.waitUntilVisible('form#tagaddform', function() {
      'div.footer'.should.be.inDOM.and.be.visible;
      'div.r-ss-wrap'.should.be.inDOM.and.be.visible;
      '#tagaddform > div.pure-g > div.pure-u-1-2'.should.be.inDOM.and.be.visible;
      '#tagaddform > div.pure-g > div.pure-u-1-2 > div'.should.be.inDOM.and.be.visible;
      this.fillSelectors('form#tagaddform', {'input[type="text"]':'ponies'},false);
      this.click('#tagaddform > div > div > div > button');
      this.click('#tagaddform > button.pure-button-primary');
    });

    casper.wait(300);

    casper.thenOpen('http://127.0.0.1:4000/', function() {
      'div.footer'.should.be.inDOM.and.be.visible;
      'div.footer'.should.contain.text('ponies');
      'div.pure-u-2-3'.should.contain.text('Welcome to rm3');
    });

    casper.thenOpen('http://127.0.0.1:4000/search.cgi/$/tag/plain/ponies', function() {
      'div.footer'.should.be.inDOM.and.be.visible;
      'body > div.pure-g > div.pure-u-2-3'.should.contain.text('Welcome to rm3');
      this.click('a[href*=logout]');
    });

    casper.then(function() {
      'a[href*=login]'.should.be.inDOM.and.be.visible;
      'div.footer'.should.be.inDOM.and.be.visible;
    });
  });
});
