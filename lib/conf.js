var pg = require('pg').native;

var Conf = function () {
	this._data = {};
	this._data.endpoints = {};
	this._data.endpoints.postgres = process.env.RM3_PG || 'postgresql://wirehead:rm3test@127.0.0.1/rm3test';

  this._data.security = {
    pbkdf2_saltlen: 32,
    pbkdf2_iterations: 25000,
    pbkdf2_keylen: 512,
  };
};

Conf.prototype.get_security = function(key) {
  return this._data.security[key];
};

Conf.prototype.get_endpoint = function(endpoint) {
	return this._data.endpoints[endpoint];
};

Conf.prototype.get_driver = function(endpoint) {
  return pg;
};
    
module.exports = exports = new Conf();