var should = require('should');
var SitePath = require ('sitepath');
var ApiClient = require('../../lib/apiclient');
var Conf = require('../../lib/conf'),
    jwtSecret = Conf.getCertificate('jwtSecret'),
    jwtIssuer = Conf.getCertificate('jwtIssuer');
var jwt = require('jsonwebtoken');
var token = jwt.sign({}, jwtSecret, {
  audience: '127.0.0.1',
  subject: 'wirehead',
  issuer: jwtIssuer
});

describe('jwt', function() {
  it('works', function(cb) {
    var client = new ApiClient('http://127.0.0.1:4000');
    client.page('/users/').get()
    .set('Authorization', 'JWT ' + token)
    .end(function(err, res) {
      if (err) {
        console.log(err);
        should.fail();
      }
      res.body.summary.should.eql({title: 'User root', abstract: 'User root'});
      cb();
    });
  });
});
