var pg = require('pg').native;
var Conf = require('./conf');
var conString = Conf.get_endpoint('postgres');
var uuid = require('node-uuid');


exports.connect_wrap = function (queryfunc) {
  pg.connect(conString, function(err, client, done) {
    if(err) {
      return console.error('error fetching client from pool', err);
    }
    queryfunc(client, done);
  });
};
