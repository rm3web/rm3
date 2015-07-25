var FormLib = require ('../../lib/formlib');
var should = require('should');

describe('formlib', function() {
  it('should #checkFieldsPresent', function() {
    var error = {};
    var body = {'butter' : 'buttereater', 'moo' : ''};
    var fields = ['goo', 'butter', 'moo'];
    FormLib.checkFieldsPresent(body, fields, error);
    error.should.have.property('goo').with.lengthOf(1);
    error.goo[0].should.have.property('error');
    error.goo[0].error.should.equal('missing');
    error.should.have.property('moo').with.lengthOf(1);
    error.moo[0].should.have.property('error');
    error.moo[0].error.should.equal('missing');
  });

  it('should check #nullOrValid', function() {
    var body = {'buttereater': true, 'strawberries': false};
    var valid = function(value) {
      return value;
    };
    var error = {};
    FormLib.nullOrValid(body, 'buttereater', valid, 'b', error);
    error.should.not.have.property('buttereater');
    FormLib.nullOrValid(body, 'strawberries', valid, 'b', error);
    error.should.have.property('strawberries').with.lengthOf(1);
    error.strawberries[0].should.equal('b');
    FormLib.nullOrValid(body, 'unicorns', valid, 'b', error);
    error.should.not.have.property('unicorns');
  });

  it('should mark an error', function() {
    var error = {};
    FormLib.markError(error, 'element', 'msg');
    error.should.have.property('element').with.lengthOf(1);
    error.element[0].should.equal('msg');
    FormLib.markError(error, 'element', 'msg2');
    error.should.have.property('element').with.lengthOf(2);
    error.element[0].should.equal('msg');
    error.element[1].should.equal('msg2');
    FormLib.markError(error, 'ele', 'msg2');
    error.should.have.property('ele').with.lengthOf(1);
    error.element[0].should.equal('msg');
    error.element[1].should.equal('msg2');
    error.ele[0].should.equal('msg2');

  });

});
