var Page = require('../lib/page');
var util = require("util");

function TempIndexClass() {
  Page.call(this);
  this.proto = 'index';
  this.view_router.addRoute('/', function(req, res, page, next) 
  {
    var view = req.entity.view();
    req.scheme.render(view, 'index', page._renderPageResponse.bind(this, req, res));
  });
}

util.inherits(TempIndexClass, Page);

var Protoset = function () {
  this._pages = {};
  this._metadata = {};
  this.add_proto('base', new Page(), {desc: 'Default Node'});
  this.add_proto('index', new TempIndexClass(), {desc: 'Index (temp)'});
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