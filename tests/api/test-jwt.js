var should = require('chai').should();
var SitePath = require ('sitepath');
var ApiClient = require('../../lib/apiclient');
var query = require('../../lib/query');
var db = require('../../lib/db');
var entity = require('../../lib/entity');
var Conf = require('../../lib/conf'),
    jwtSecret = Conf.getCertificate('jwtSecret'),
    jwtIssuer = Conf.getCertificate('jwtIssuer');
var jwt = require('jsonwebtoken');
var userEnt;

describe('jwt', function() {
  before(function(cb) {
    query.entityFromPath(db, false, entity.Entity, {}, {context: "ROOT"}, new SitePath(['wh', 'users', 'wirehead']), null, function(err, ent) {
      should.not.exist(err);
      userEnt = ent;
      cb();
    });
  });

  it('works with a JWT header', function(cb) {
    var token = jwt.sign({}, jwtSecret, {
      audience: '127.0.0.1/accessToken',
      subject: 'abc123/wirehead:' + userEnt._entityId,
      issuer: jwtIssuer
    });
    var client = new ApiClient('http://127.0.0.1:4000');
    client.page('/users/').get()
    .set('Authorization', 'JWT ' + token)
    .end(function(err, res) {
      should.not.exist(err);
      should.exist(res.body);
      should.exist(res.body.summary);
      res.body.summary.should.eql({title: 'User root', abstract: 'User root'});
      cb(err);
    });
  });

  it('works with a bearer header', function(cb) {
    var token = jwt.sign({}, jwtSecret, {
      audience: '127.0.0.1/accessToken',
      subject: 'abc123/wirehead:' + userEnt._entityId,
      issuer: jwtIssuer
    });
    var client = new ApiClient('http://127.0.0.1:4000');
    client.page('/users/').get()
    .set('Authorization', 'Bearer ' + token)
    .end(function(err, res) {
      should.not.exist(err);
      should.exist(res.body);
      should.exist(res.body.summary);
      res.body.summary.should.eql({title: 'User root', abstract: 'User root'});
      cb(err);
    });
  });

  it('rejects missing subjects', function(cb) {
    var token = jwt.sign({}, jwtSecret, {
      audience: '127.0.0.1/accessToken',
      issuer: jwtIssuer
    });
    var client = new ApiClient('http://127.0.0.1:4000');
    client.page('/users/').get()
    .set('Authorization', 'Bearer ' + token)
    .end(function(err, res) {
      should.exist(err);
      cb();
    });
  });

  it('rejects bad subjects', function(cb) {
    var token = jwt.sign({}, jwtSecret, {
      audience: '127.0.0.1/accessToken',
      subject: 'abc1235/blah:bla',
      issuer: jwtIssuer
    });
    var client = new ApiClient('http://127.0.0.1:4000');
    client.page('/users/').get()
    .set('Authorization', 'Bearer ' + token)
    .end(function(err, res) {
      should.exist(err);
      cb();
    });
  });
});
