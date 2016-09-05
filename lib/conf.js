var path = require('path');
var crypto = require('crypto');
var Pg = require('pg').native;
var PgWfBackend = require('wf-pg-backend');
var pgConnectionParse = require('pg-connection-string').parse;
var uuid = require('node-uuid');
require('dotenv').load({silent: true});

var Conf = function() {
  this._data = {};
  this._data.config = {};
  this._data.config.listenPort = process.env.RM3_LISTEN_PORT || 4000;
  this._data.config.listenHostname = process.env.RM3_LISTEN_HOST || '127.0.0.1';
  this._data.config.cacheControlDisable = process.env.RM3_CACHE_CONTROL_DISABLE || false;
  this._data.config.disableHttpsChecks = process.env.RM3_DANGER_DISABLE_HTTPS_CHECKS || false;
  this._data.config.trustProxy = process.env.RM3_DANGER_TRUST_PROXY || false;
  this._data.endpoints = {};
  this._data.endpoints.email = process.env.RM3_EMAIL || 'smtps://127.0.0.1';
  this._data.endpoints.postgres = process.env.RM3_PG || 'postgresql://wirehead:rm3test@127.0.0.1/rm3test';
  this._data.endpoints.sessionRedis = process.env.RM3_SESSION_REDIS || 'redis://127.0.0.1:6379/0';
  this._data.endpoints.cacheRedis = process.env.RM3_CACHE_REDIS || 'redis://127.0.0.1:6379/0';
  this._data.endpoints.workflowPostgres = pgConnectionParse(this._data.endpoints.postgres);
  this._data.path = {};
  this._data.path.resources = process.env.RM3_RESOURCES || path.join(__dirname, '../scheme/default/static');
  this._data.path.localBlobs = process.env.RM3_LOCAL_BLOBS || path.join(__dirname, '../blobs');
  this._data.certificates = {};
  this._data.certificates.twitterConsumerKey = process.env.RM3_TWITTER_CONSUMER_KEY;
  this._data.certificates.twitterConsumerSecret = process.env.RM3_TWITTER_CONSUMER_SECRET;
  this._data.certificates.jwtSecret = process.env.RM3_JWT_SECRET;
  this._data.certificates.jwtIssuer = process.env.RM3_JWT_ISSUER;
  this._data.certificates.totpIssuer = process.env.RM3_TOTP_ISSUER || 'AnonymousRm3';
  this._data.certificates.sessionSecret = process.env.RM3_SESSION_SECRET;
  this._data.certificates.sessionFlag = false;
  if (!this._data.certificates.sessionSecret) {
    this._data.certificates.sessionSecret = crypto.randomBytes(360).toString('base64');
    this._data.certificates.sessionFlag = true;
  }
  this._data.nodeId = uuid.v4();
};

Conf.prototype.getConfig = function(config) {
  return this._data.config[config];
};

Conf.prototype.getNodeId = function() {
  return this._data.nodeId;
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
  if (endpoint === 'postgres') {
    return Pg;
  } else if (endpoint === 'wf') {
    return PgWfBackend;
  }
};

module.exports = exports = new Conf();
