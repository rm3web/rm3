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

Page.prototype.tags = function(tags) {
  var req;
  if (tags) {
    req = superagent
      .put(this.base + this.page + 'tags.cgi')
      .send(tags)
      .accept('application/json');
    return req;
  } else {
    req = superagent
      .get(this.base + this.page + 'tags.cgi')
      .accept('application/json');
    return req;
  }
};

var ApiClient = function(base) {
  this.base = base;
};

ApiClient.prototype.page = function(page) {
  return new Page(this.base, page);
};

exports = module.exports = ApiClient;
