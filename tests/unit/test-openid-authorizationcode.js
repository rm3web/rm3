var AuthorizationCode = require ('../../lib/openid/authorizationcode.js');
var should = require('chai').should();

describe('AuthorizationCode', function() {
  it('should work as expected', function(cb) {
    var secret = 'secretsecret';
    var issuer = 'issuer';
    var clientId = 'client';
    var userId = 'user';
    var redirectUri = 'redirect';
    AuthorizationCode.generateAuthorizationCode(secret, issuer, 'www.example.com', 60, clientId, userId, redirectUri, function(err, token) {
      should.not.exist(err);
      AuthorizationCode.validateAuthorizationCode(secret, issuer, 'www.example.com', 60, token, clientId, function(err, rec) {
        should.not.exist(err);
        rec.redirectUri.should.equal(redirectUri);
        rec.aud.should.equal('www.example.com/authorization/' + userId);
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
    AuthorizationCode.generateAuthorizationCode(secret, issuer, 'www.example.com', 60, clientId, userId, redirectUri, function(err, token) {
      should.not.exist(err);
      AuthorizationCode.validateAuthorizationCode('badsecret', 'www.example.com', 60, issuer, token, clientId, function(err, sub) {
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
    AuthorizationCode.generateAuthorizationCode(secret, issuer, 'www.example.com', 60, clientId, userId, redirectUri, function(err, token) {
      should.not.exist(err);
      AuthorizationCode.validateAuthorizationCode(secret, 'badisue', 'www.example.com', 60, token, clientId, function(err, sub) {
        should.exist(err);
        cb();
      });
    });
  });
});
