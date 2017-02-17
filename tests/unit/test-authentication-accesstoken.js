var AccessToken = require ('../../lib/authentication/accesstoken.js');
var should = require('chai').should();

describe('conf', function() {
  it('should work as expected', function(cb) {
    var secret = 'secretsecret';
    var issuer = 'issuer';
    var subject = 'subject';
    AccessToken.generateAccessToken(secret, issuer, 'www.example.com', 60, subject, function(err, token) {
      should.not.exist(err);
      AccessToken.validateAccessToken(secret, issuer, 'www.example.com', 60, token, function(err, sub) {
        should.not.exist(err);
        sub.should.equal(subject);
        cb(err);
      });
    });
  });
  it('should reject bad secrets', function(cb) {
    var secret = 'secretsecret';
    var issuer = 'issuer';
    var subject = 'subject';
    AccessToken.generateAccessToken(secret, issuer, 'www.example.com', 60, subject, function(err, token) {
      should.not.exist(err);
      AccessToken.validateAccessToken('badsecret', issuer, 'www.example.com', 60, token, function(err, sub) {
        should.exist(err);
        cb();
      });
    });
  });

  it('should reject bad issuers', function(cb) {
    var secret = 'secretsecret';
    var issuer = 'issuer';
    var subject = 'subject';
    AccessToken.generateAccessToken(secret, issuer, 'www.example.com', 60, subject, function(err, token) {
      should.not.exist(err);
      AccessToken.validateAccessToken(secret, 'badisue', 'www.example.com', 60, token, function(err, sub) {
        should.exist(err);
        cb();
      });
    });
  });
});
