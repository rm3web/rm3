var Page = require ('../../lib/page');
var events = require("events");
var test = require('tape');

function mock_req(t) {
  var req = {scheme: {}, entity: {}, sitepath: {}, method: 'GET'};
  req.sitepath.page = null;
  req.scheme.render = function (data, view, callback) {
    t.fail('should not try to render');
  };

  req.entity.view = function() {
    t.fail('should not try to view');
    return {};
  };

  return req;
}

function mock_req_view(t, req) {
  req.entity.view = function() {
    t.pass('view');
    return {};
  };
}

function mock_req_scheme(t, req) {
  req.scheme.render = function (data, view, callback) {
    t.pass('render');
    t.deepEqual(typeof callback, "function");
    var outstream = new events.EventEmitter();
    callback(null, outstream);
    outstream.emit("data","thunk");
    outstream.emit("end");
  };
}

function mock_res(t) {
  var res = {};

  res.writeHead = function(type, data)
  {
    t.fail('should not try to writeHead');
  };
  res.write = function(data)
  {
    t.fail('should not try to write');
  };
  res.end = function()
  {
    t.fail('should not try to end');
  };

  return res;
}

test('page', function (t) {
  t.plan(6);
  var req = mock_req(t);
  var res = mock_res(t);
  mock_req_view(t, req);
  mock_req_scheme(t, req);
  
  res.writeHead = function(type, data)
  {
    t.deepEqual(type,200);
    t.deepEqual(data,{'Content-Type': 'text/html'});
  };
  res.write = function(data)
  {
    t.deepEqual(data,"thunk");
  };
  res.end = function()
  {
    t.end();
  };
  
  var page = new Page();
  page.view_router.addRoute('/GET/', function(req, res, page, next) 
  {
    var view = req.entity.view();
    req.scheme.render(view, 'view', page._renderPageResponse.bind(this, req, res));
  });

  page.render({}, req,res);
});

test('page view_map', function (t) {
  t.plan(6);
  var req = mock_req(t);
  var res = mock_res(t);
  mock_req_view(t, req);
  mock_req_scheme(t, req);
  req.sitepath.page = 'glitter.html';
  
  res.writeHead = function(type, data)
  {
    t.deepEqual(type,200);
    t.deepEqual(data,{'Content-Type': 'text/html'});
  };
  res.write = function(data)
  {
    t.deepEqual(data,"thunk");
  };
  res.end = function()
  {
    t.end();
  };
  
  var page = new Page();
  page.view_router.addRoute('/GET/glitter', function(req, res, page, next) 
  {
    var view = req.entity.view();
    req.scheme.render(view, 'view', page._renderPageResponse.bind(this, req, res));
  });

  page.view_router.addRoute('/GET/', function(req, res, page, next) 
  {
    t.fail();
  });

  page.render({}, req,res);
});

test('page command_map', function (t) {
  t.plan(7);
  var req = mock_req(t);
  var res = mock_res(t);
  mock_req_view(t, req);
  mock_req_scheme(t, req);
  req.sitepath.page = 'glitter.html';
  req.method = 'POST';
  
  res.writeHead = function(type, data)
  {
    t.deepEqual(type,200);
    t.deepEqual(data,{'Content-Type': 'text/html'});
  };
  res.write = function(data)
  {
    t.deepEqual(data,"thunk");
  };
  res.end = function()
  {
    t.end();
  };
  
  var page = new Page();
  page.command_router.addRoute('/POST/glitter', function(req, res, page, db, next)
  {
    t.pass('called command');
    next();
  });

  page.view_router.addRoute('/*/glitter', function(req, res, page, next) 
  {
    var view = req.entity.view();
    req.scheme.render(view, 'view', page._renderPageResponse.bind(this, req, res));
  });

  page.view_router.addRoute('/GET/', function(req, res, page, next) 
  {
    t.fail();
  });

  page.render({}, req,res);
});

test('page no views', function (t) {
  t.plan(1);
  var req = mock_req();
  var res = mock_res();
  var page = new Page();

  page.render({}, req, res, function(err) {
    t.deepEqual(err.name, 'NoViewFoundError');
    t.end();
  });
});