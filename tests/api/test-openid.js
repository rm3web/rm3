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
    tokenHost: 'http://127.0.0.1:4000/oauth/token'
  }
};
var tokenConfig = {};
var oauth2 = require('simple-oauth2').create(credentials);

describe('oauth2', function() {
  it('gets a client access token', function(cb) {
    oauth2.clientCredentials.getToken(tokenConfig, function(err, result) {
      should.not.exist(err);
      should.exist(result);

      var token = oauth2.accessToken.create(result);
      token.token.token_type.should.equal('Bearer');
      token.token.should.have.property('access_token');
      cb(err);
    });
  });

  it('gets a user access token and accesses a protected resource', function(cb) {
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
});
