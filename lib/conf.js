var pg = require('pg').native;

var Conf = function() {
  this._data = {};
  this._data.endpoints = {};
  this._data.endpoints.postgres = process.env.RM3_PG || 'postgresql://wirehead:rm3test@127.0.0.1/rm3test';
};

Conf.prototype.getEndpoint = function(endpoint) {
  return this._data.endpoints[endpoint];
};

Conf.prototype.getDriver = function(endpoint) {
  return pg;
};

module.exports = exports = new Conf();
