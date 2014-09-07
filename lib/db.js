var Conf = require('./conf');
var conString = Conf.get_endpoint('postgres');
var uuid = require('node-uuid');
var pg = Conf.get_driver('postgres');

exports.connect_wrap = function (queryfunc) {
  pg.connect(conString, function(err, client, done) {
    if(err) {
      return console.error('error fetching client from pool', err);
    }
    queryfunc(client, done);
  });
};

exports.gun_database = function () {
  pg.connect(conString, function(err, client, done) {
    if(err) {
      return console.error('error fetching client from pool', err);
    }
    done();
    client.end();
  });
}