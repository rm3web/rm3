var FormLib = require ('../../lib/formlib');
var should = require('should');

/*

exports.markError = function markError(error, element, msg) {
  if (!error.hasOwnProperty(element)) {
    error[element] = [];
  }
  error[element].push(msg);
};

exports.checkFieldsPresent = function checkFieldsPresent(body, fields, error) {
  fields.forEach(function(element, index, array) {
    if (validator.isNull(body[element])) {
      exports.markError(error, element, {error: 'missing'});
    }
  });
};

exports.nullOrValid = function nullOrValid(body, element, valid, msg, error) {
  if (!validator.isNull(body[element])) {
    if (!valid(body[element])) {
      exports.markError(error, element, msg);
    }
  }
};

*/
describe('formlib', function() {
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
