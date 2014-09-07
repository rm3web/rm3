var Page = require ('../../lib/page');
var events = require("events");
var test = require('tape');

test('page', function (t) {
  t.plan(6);
  var req = {scheme: {}, entity: {}, sitepath: {}};
  req.sitepath.page = null;
  var res = {};

  req.scheme.render = function (data, callback) {
    t.pass('render');
    t.deepEqual(typeof callback, "function");
    var outstream = new events.EventEmitter();
    callback(null, outstream);
    outstream.emit("data","thunk");
    outstream.emit("end")
  };
  req.entity.view = function() {
    t.pass('view');
    return {};
  }

  res.writeHead = function(type, data)
  {
    t.deepEqual(type,200);
    t.deepEqual(data,{'Content-Type': 'text/html'})
  }
  res.write = function(data)
  {
    t.deepEqual(data,"thunk")
  }
  res.end = function()
  {
    t.end();
  }
  var page = new Page();

  page.render(req,res);
});