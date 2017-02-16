var AuthorizationCode = require ('../../lib/openid/authorizationcode.js');
var should = require('chai').should();

describe('AuthorizationCode', function() {
  it('should work as expected', function(cb) {
    var secret = 'secretsecret';
    var issuer = 'issuer';
    var clientId = 'client';
    var userId = 'user';
    var redirectUri = 'redirect';
    AuthorizationCode.generateAuthorizationCode(secret, issuer, clientId, userId, redirectUri, function(err, token) {
      should.not.exist(err);
      AuthorizationCode.validateAuthorizationCode(secret, issuer, token, clientId, function(err, rec) {
        should.not.exist(err);
        rec.redirectUri.should.equal(redirectUri);
        rec.aud.should.equal('127.0.0.1/authorization/' + userId);
        cb(err);
      });
    });
  });
  it('should reject bad secrets', function(cb) {
    var secret = 'secretsecret';
    var issuer = 'issuer';
    var clientId = 'client';
    var userId = 'user';
    var redirectUri = 'redirect';
    AuthorizationCode.generateAuthorizationCode(secret, issuer, clientId, userId, redirectUri, function(err, token) {
      should.not.exist(err);
      AuthorizationCode.validateAuthorizationCode('badsecret', issuer, token, clientId, function(err, sub) {
        should.exist(err);
        cb();
      });
    });
  });

  it('should reject bad issuers', function(cb) {
    var secret = 'secretsecret';
    var issuer = 'issuer';
    var clientId = 'client';
    var userId = 'user';
    var redirectUri = 'redirect';
    AuthorizationCode.generateAuthorizationCode(secret, issuer, clientId, userId, redirectUri, function(err, token) {
      should.not.exist(err);
      AuthorizationCode.validateAuthorizationCode(secret, 'badisue', token, clientId, function(err, sub) {
        should.exist(err);
        cb();
      });
    });
  });
});
