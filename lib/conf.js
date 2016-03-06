var path = require('path');
var crypto = require('crypto');
var pg = require('pg').native;
require('dotenv').load({silent: true});

var Conf = function() {
  this._data = {};
  this._data.endpoints = {};
  this._data.endpoints.postgres = process.env.RM3_PG || 'postgresql://wirehead:rm3test@127.0.0.1/rm3test';
  this._data.path = {};
  this._data.path.resources = process.env.RM3_RESOURCES || path.join(__dirname, '../scheme/default/static');
  this._data.certificates = {};
  this._data.certificates.twitterConsumerKey = process.env.RM3_TWITTER_CONSUMER_KEY;
  this._data.certificates.twitterConsumerSecret = process.env.RM3_TWITTER_CONSUMER_SECRET;
  this._data.certificates.jwtSecret = process.env.RM3_JWT_SECRET;
  this._data.certificates.jwtIssuer = process.env.RM3_JWT_ISSUER;
  this._data.certificates.sessionSecret = process.env.RM3_SESSION_SECRET
  this._data.certificates.sessionFlag = false;
  if (!this._data.certificates.sessionSecret) {
    this._data.certificates.sessionSecret = crypto.randomBytes(360).toString('base64');
    this._data.certificates.sessionFlag = true;
  }
};

Conf.prototype.getPath = function(resource) {
  return this._data.path[resource];
};

Conf.prototype.getCertificate = function(cert) {
  return this._data.certificates[cert];
};

Conf.prototype.getEndpoint = function(endpoint) {
  return this._data.endpoints[endpoint];
};

Conf.prototype.getDriver = function(endpoint) {
  return pg;
};

module.exports = exports = new Conf();
