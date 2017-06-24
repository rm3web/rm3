var should = require('chai').should();
var SitePath = require ('sitepath');
var ApiClient = require('../../lib/apiclient');
var Conf = require('../../lib/conf');
var credentials = {
  client: {
    id: 'abc123',
    secret: 'ssh-secret'
  },
  auth: {
    tokenHost: 'http://127.0.0.1:4000',
    tokenPath: '/$oauth/token',
    authorizePath: '/$oauth/authorize'
  }
};
var badCredentials = {
  client: {
    id: 'badbadbad',
    secret: 'naughty'
  },
  auth: {
    tokenHost: 'http://127.0.0.1:4000',
    tokenPath: '/$oauth/token',
    authorizePath: '/$oauth/authorize'
  }
};
var tokenConfig = {};
var oauth2 = require('simple-oauth2').create(credentials);

describe('oauth2', function() {
  this.timeout(4000);
  it('rejects bad bearer tokens', function(cb) {
    var client = new ApiClient('http://127.0.0.1:4000');
    client.page('/users/').get()
    .set('Authorization', 'Bearer 12413256136.1436146.146666')
    .end(function(err, res) {
      should.exist(err);
      cb();
    });
  });
  describe('with a client access token', function() {
    it('works', function(cb) {
      oauth2.clientCredentials.getToken(tokenConfig, function(err, result) {
        should.not.exist(err);
        should.exist(result);

        var token = oauth2.accessToken.create(result);
        token.token.token_type.should.equal('Bearer');
        token.token.should.have.property('access_token');
        cb(err);
      });
    });

    it('rejects bad credentials', function(cb) {
      var oauth2bad = require('simple-oauth2').create(badCredentials);
      oauth2bad.clientCredentials.getToken(tokenConfig, function(err, result) {
        should.exist(err);
        cb();
      });
    });
  });
  describe('with an client access token and owner password', function() {
    it('works', function(cb) {
      var tokenConfig = {
        username: 'wirehead',
        password: 'password'
      };

      oauth2.ownerPassword.getToken(tokenConfig, function(err, result) {
        should.not.exist(err);
        should.exist(result);

        var token = oauth2.accessToken.create(result);
        token.token.token_type.should.equal('Bearer');
        token.token.should.have.property('access_token');
        var client = new ApiClient('http://127.0.0.1:4000');
        client.page('/users/').get()
          .set('Authorization', 'Bearer ' + token.token.access_token)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.summary.should.eql({title: 'User root', abstract: 'User root'});
            cb(err);
          });
      });
    });
    it('rejects bad client credentials', function(cb) {
      var oauth2bad = require('simple-oauth2').create(badCredentials);
      var tokenConfig = {
        username: 'wirehead',
        password: 'password'
      };
      oauth2bad.ownerPassword.getToken(tokenConfig, function(err, result) {
        should.exist(err);
        cb();
      });
    });
    it('rejects bad passwords', function(cb) {
      var tokenConfig = {
        username: 'wirehead',
        password: 'gwt'
      };

      oauth2.ownerPassword.getToken(tokenConfig, function(err, result) {
        should.exist(err);
        cb();
      });
    });
  });
});
