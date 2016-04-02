var Conf = require ('../../lib/conf');
var entity = require('../../lib/entity');
var sitepath = require ('sitepath');
var async = require('async');
var uuid = require('node-uuid');
var user = require('../../lib/user');
var resources = require('../lib/resources.js');
var should = require('should');
var db = require('../../lib/db');
var query = require('../../lib/query');
require('mocha-steps');

describe('user', function() {
  this.timeout(8000); // This might take a bit of time
  var now = new Date();
  var ents = {};
  var userpath = new sitepath(['wh', 'users']);

  resources.userResource(userpath, 'usertest', ents, 'user', now);

  describe('user login', function() {
    step('#findByUsername', function(done) {
      user.findByUsername(db, {}, query, entity.Entity, userpath, 'usertest', function(err, ent2) {
        ents.req = ent2;
        if (err) {
          should.fail(err);
        }
        done(err);
      });
    });
    step('#authenticatePassword', function(done) {
      user.authenticatePassword(db, {}, query, 'usertest', 'meow_kitty', function(err) {
        if (err) {
          should.fail(err);
        }
        done(err);
      });
    });
  });
});
