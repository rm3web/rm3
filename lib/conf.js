var pg = require('pg').native;

var Conf = function() {
  this._data = {};
  this._data.endpoints = {};
  this._data.endpoints.postgres = process.env.RM3_PG || 'postgresql://wirehead:rm3test@127.0.0.1/rm3test';

  this._data.security = {
    pbkdf2Saltlen: 32,
    pbkdf2Iterations: 25000,
    pbkdf2Keylen: 512,
  };
};

Conf.prototype.getSecurity = function(key) {
  return this._data.security[key];
};

Conf.prototype.getEndpoint = function(endpoint) {
  return this._data.endpoints[endpoint];
};

Conf.prototype.getDriver = function(endpoint) {
  return pg;
};

module.exports = exports = new Conf();
