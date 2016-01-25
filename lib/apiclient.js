var superagent = require('superagent');

var Page = function(base, page) {
  this.base = base;
  this.page = page;
};

Page.prototype.get = function() {
  var req = superagent
    .get(this.base + this.page)
    .accept('application/json');
  return req;
};

Page.prototype.history = function() {
  var req = superagent
    .get(this.base + this.page + 'history.cgi')
    .accept('application/activity+json');
  return req;
};

Page.prototype.allowedTags = function() {
  var req = superagent
    .get(this.base + this.page + 'allowedtags.cgi')
    .accept('application/json');
  return req;
};

var ApiClient = function(base) {
  this.base = base;
};

ApiClient.prototype.login = function(username, password) {
  var req = superagent
    .post(this.base + '/$login/')
    .accept('application/json')
    .send({username: username, password: password});
  return req;
};

ApiClient.prototype.page = function(page) {
  return new Page(this.base, page);
};

exports = module.exports = ApiClient;
