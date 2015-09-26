var Conf = require ('../lib/conf');
var entity = require('../lib/entity');
var sitepath = require ('../lib/sitepath');
var update = require('../lib/update');
var query = require('../lib/query');
var db = require('../lib/db');
var user = require('../lib/user');
var async = require('async');
var resources = require('../tests/lib/resources.js');
var makeFakeEntity = require('../tests/lib/fakedata').makeFakeEntity;

suite('update#createEntity', function() {
  var ents = {};

  var path = new sitepath(['wh','perf_update_create_entity']);
  var now = new Date();

  bench('root access', function(done) {
    makeFakeEntity(path, done);
  });

});

