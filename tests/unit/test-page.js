var Page = require ('../../lib/page');
var events = require("events");
var should = require('should');

function mockReq() {
  var req = {scheme: {}, entity: {}, sitepath: {}, method: 'GET'};
  req.sitepath.page = null;
  req.scheme.render = function(view, data, callback) {
    should.fail('should not try to render');
  };

  req.entity.view = function() {
    should.fail('should not try to view');
    return {};
  };

  return req;
}

function mockReqView(req) {
  req.entity.view = function() {
    return {};
  };
}

function mockReqScheme(req) {
  req.scheme.render = function(view, data, callback) {
    should.deepEqual(typeof callback, "function");
    var outstream = new events.EventEmitter();
    callback(null, outstream);
    outstream.emit("data", "thunk");
    outstream.emit("end");
  };
}

function mockRes() {
  var res = {};

  res.writeHead = function(type, data) {
    should.fail('should not try to writeHead');
  };
  res.write = function(data) {
    should.fail('should not try to write');
  };
  res.end = function() {
    should.fail('should not try to end');
  };

  return res;
}

describe('page', function() {
  var res, req;

  beforeEach(function() {
    req = mockReq();
    res = mockRes();
  });

  context('with view', function() {
    beforeEach(function() {
      mockReqView(req);
      mockReqScheme(req);
    });
    beforeEach(function() {
      res.writeHead = function(type, data) {
        should.deepEqual(type, 200);
        should.deepEqual(data, {'Content-Type': 'text/html'});
      };
      res.write = function(data) {
        should.deepEqual(data, "thunk");
      };
    });

    it('should render', function(done) {
      res.end = function() {
        done();
      };

      var page = new Page();
      page.securityRouter.get('', function(req, res, next) {
        next();
      });
      page.freshnessRouter.get('', function(req, res, next) {
        next();
      });
      page.viewRouter.get('', function(req, res, next) {
        var view = req.entity.view();
        req.scheme.render('view', view, req.page._renderPageResponse.bind(this, req, res));
        next();
      });

      page.render(req, res, function(err) {
        if (err) {
          should.fail();
        }
      });
    });

    it('should render a view', function(done) {
      req.sitepath.page = 'glitter.html';

      res.end = function() {
        done();
      };

      var page = new Page();
      page.freshnessRouter.get('glitter.html', function(req, res, next) {
        next();
      });
      page.securityRouter.get('glitter.html', function(req, res, next) {
        next();
      });
      page.viewRouter.get('glitter.html', function(req, res, next) {
        var view = req.entity.view();
        req.scheme.render('view', view, req.page._renderPageResponse.bind(this, req, res));
        next();
      });

      page.viewRouter.get('', function(req, res, page, next) {
        should.fail();
      });

      page.render(req, res, function(err) {
        if (err) {
          should.fail();
        }
      });
    });

    it('should map a command', function(done) {
      req.sitepath.page = 'glitter.html';
      req.method = 'POST';

      res.end = function() {
        done();
      };

      var page = new Page();
      page.commandRouter.post('glitter.html', function(req, res, next) {
        next();
      });
      page.freshnessRouter.post('glitter.html', function(req, res, next) {
        next();
      });
      page.securityRouter.post('glitter.html', function(req, res, next) {
        next();
      });
      page.viewRouter.routeAll('glitter.html', function(req, res, next) {
        var view = req.entity.view();
        req.scheme.render('view', view, req.page._renderPageResponse.bind(this, req, res));
        next();
      });

      page.viewRouter.routeAll('', function(req, res, next) {
        should.fail();
      });

      page.render(req, res, function(err) {
        if (err) {
          should.fail();
        }
      });
    });
  });

  context('without security', function() {
    it('should throw an error', function(done) {
      var page = new Page();

      page.render(req, res, function(err) {
        err.name.should.equal('DefaultDenyError');
        done();
      });
    });
  });

  context('without view', function() {
    it('should throw an error', function(done) {
      var page = new Page();

      page.securityRouter.routeAll('', function(req, res, next) {
        next();
      });
      page.freshnessRouter.routeAll('', function(req, res, next) {
        next();
      });

      page.render(req, res, function(err) {
        err.name.should.equal('NoViewFoundError');
        done();
      });
    });
  });
});
