var should = require('should');
/* global casper */
/*jshint expr:true */

describe('Base page', function() {
  before(function() {
    casper.start('http://127.0.0.1:4000/');
  });

  it('should respond', function() {
    casper.then(function() {
      'Welcome to rm3'.should.matchTitle;
    });
  });
});
