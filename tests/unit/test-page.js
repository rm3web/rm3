var Page = require ('../../lib/page');
var events = require("events");
var should = require('should');

function mock_req() {
  var req = {scheme: {}, entity: {}, sitepath: {}, method: 'GET'};
  req.sitepath.page = null;
  req.scheme.render = function (view, data, callback) {
    should.fail('should not try to render');
  };

  req.entity.view = function() {
    should.fail('should not try to view');
    return {};
  };

  return req;
}

function mock_req_view(req) {
  req.entity.view = function() {
    return {};
  };
}

function mock_req_scheme(req) {
  req.scheme.render = function (view, data, callback) {
    should.deepEqual(typeof callback, "function");
    var outstream = new events.EventEmitter();
    callback(null, outstream);
    outstream.emit("data","thunk");
    outstream.emit("end");
  };
}

function mock_res() {
  var res = {};

  res.writeHead = function(type, data)
  {
    should.fail('should not try to writeHead');
  };
  res.write = function(data)
  {
    should.fail('should not try to write');
  };
  res.end = function()
  {
    should.fail('should not try to end');
  };

  return res;
}

describe('page', function() {
  var res, req;

  beforeEach(function() {
    req = mock_req();
    res = mock_res();
  });

  context('with view', function() {
    beforeEach(function() {
      mock_req_view(req);
      mock_req_scheme(req);
    });
    beforeEach(function() {
      res.writeHead = function(type, data)
      {
        should.deepEqual(type,200);
        should.deepEqual(data,{'Content-Type': 'text/html'});
      };
      res.write = function(data)
      {
        should.deepEqual(data,"thunk");
      };
    });

    it('should render', function (done) {
      res.end = function()
      {
        done();
      };
      
      var page = new Page();
      page.view_router.addRoute('/GET/', function(req, res, page, next) 
      {
        var view = req.entity.view();
        req.scheme.render('view', view, page._renderPageResponse.bind(this, req, res));
      });

      page.render({}, req,res);
    });

    it('should render a view', function (done) {
      req.sitepath.page = 'glitter.html';

      res.end = function()
      {
        done();
      };
      
      var page = new Page();
      page.view_router.addRoute('/GET/glitter', function(req, res, page, next) 
      {
        var view = req.entity.view();
        req.scheme.render('view', view, page._renderPageResponse.bind(this, req, res));
      });

      page.view_router.addRoute('/GET/', function(req, res, page, next) 
      {
        should.fail();
      });

      page.render({}, req,res);
    });

    it('should map a command', function (done) {
      req.sitepath.page = 'glitter.html';
      req.method = 'POST';

      res.end = function()
      {
        done();
      };
      
      var page = new Page();
      page.command_router.addRoute('/POST/glitter', function(req, res, page, db, next)
      {
        next();
      });

      page.view_router.addRoute('/*/glitter', function(req, res, page, next) 
      {
        var view = req.entity.view();
        req.scheme.render('view', view, page._renderPageResponse.bind(this, req, res));
      });

      page.view_router.addRoute('/GET/', function(req, res, page, next) 
      {
        should.fail();
      });

      page.render({}, req,res);
    });
  });

  context('without view', function() {
    it('should throw an error', function (done) {
      var page = new Page();

      page.render({}, req, res, function(err) {
        err.name.should.equal('NoViewFoundError');
        done();
      });
    });
  });
});