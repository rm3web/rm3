var i10n = require ('../../lib/i10n');
var should = require('chai').should();

describe('i10n', function() {
  it('should start up with some strings', function() {
    i10n.formatMessage('PROTO_BASE',{}).should.equal('Default Node');
    var intlObj = i10n.getIntl();
    intlObj.locales.should.equal('en-US');
    intlObj.messages.PROTO_BASE.should.equal('Default Node');
  });
  it('should add an intl message', function() {
    i10n.addIntlMessage('TEST_SET', {'en-US': 'messages'});
    i10n.formatMessage('TEST_SET',{}).should.equal('messages');
    var intlObj = i10n.getIntl();
    intlObj.messages.TEST_SET.should.equal('messages');
  });
});
