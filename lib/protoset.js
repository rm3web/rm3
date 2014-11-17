var Page = require('../lib/page');

var Protoset = function () {
  this._pages = {};
  this._metadata = {};
  this.add_proto('base', new Page(), {desc: 'Default Node'});
};

Protoset.prototype.add_proto = function(tag, proto, metadata) {
  this._pages[tag] = proto;
  this._metadata[tag] = metadata;
};

Protoset.prototype.get_page = function(proto) {
  return this._pages[proto];
};

Protoset.prototype.list_protos = function() {
  return this._metadata;
};

module.exports = exports = new Protoset();