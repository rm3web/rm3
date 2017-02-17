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
var token;

describe('tags', function() {
  before(function(cb) {
    query.entityFromPath(db, false, entity.Entity, {}, {context: "ROOT"}, new SitePath(['wh', 'users', 'wirehead']), null, function(err, ent) {
      should.not.exist(err);
      token = jwt.sign({}, jwtSecret, {
        audience: '127.0.0.1/accessToken',
        subject: 'abc123/wirehead:' + ent._entityId,
        issuer: jwtIssuer
      });
      cb();
    });
  });

  it('gets tags', function(cb) {
    var client = new ApiClient('http://127.0.0.1:4000');
    client.page('/').tags().end(function(err, res) {
      if (err) {
        should.fail();
        return cb(err);
      }
      res.body.should.eql(
        {"ontags": [],
          "popularTags": [],
          "predicates":
          [{id: 'plain',
            name: 'Plain tag (no semantic information)',
            metadataClass: 'plain'},
          {id: 'wh.meta.dc.coverage',
            name: 'Coverage',
            metadataClass: 'dc'},
          {id: 'wh.meta.dc.creator',
            name: 'Creator',
            metadataClass: 'dc'},
          {id: 'wh.meta.dc.subject',
            name: 'Subject',
            metadataClass: 'dc'}],
          "tags": {"navigation": [{"@id": "navbar", "objClass": "tag"}]}
        });
      cb();
    });
  });

  it('rejects unauthed access', function(cb) {
    var client = new ApiClient('http://127.0.0.1:4000');
    client.page('/').tags({"tags": {
      "navigation": [{"@id": "navbar", "objClass": "tag"}],
      "plain" : [{"@id": "boo", "objClass": "tag"}]
    }})
    .end(function(err, res) {
      if (!err) {
        should.fail();
      }
      cb();
    });
  });

  it('adds tags', function(cb) {
    var client = new ApiClient('http://127.0.0.1:4000');
    client.page('/').tags({"tags": {
      "navigation": [{"@id": "navbar", "objClass": "tag"}],
      "plain" : [{"@id": "boo", "objClass": "tag"}]
    }})
    .set('Authorization', 'JWT ' + token)
    .end(function(err, res) {
      if (err) {
        console.log(err);
        should.fail();
      }
      client.page('/').tags().end(function(err, res) {
        if (err) {
          should.fail();
          return cb(err);
        }
        res.body.should.eql(
          {"ontags": [],
            "popularTags": [],
            "predicates":
            [{id: 'plain',
              name: 'Plain tag (no semantic information)',
              metadataClass: 'plain'},
            {id: 'wh.meta.dc.coverage',
              name: 'Coverage',
              metadataClass: 'dc'},
            {id: 'wh.meta.dc.creator',
              name: 'Creator',
              metadataClass: 'dc'},
            {id: 'wh.meta.dc.subject',
              name: 'Subject',
              metadataClass: 'dc'}],
            "tags": {"navigation": [{"@id": "navbar", "objClass": "tag"}],
              "plain" : [{"@id": "boo", "objClass": "tag"}]}
          });
        cb();
      });
    });
  });
});
