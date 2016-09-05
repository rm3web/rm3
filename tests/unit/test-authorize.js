var authorize = require ('../../lib/authorize');
var should = require('should');
var SitePath = require ('sitepath');

describe('authorize', function() {
  it('should pass through', function(done) {
    var req = {};
    var res = {};
    req.entity = {permissions: {}};

    authorize({})(req, res, function next(err) {
      if (err) {
        should.fail();
      }
      done(err);
    });
  });

  describe('requiresAuth', function() {
    it('should fail with no user', function(done) {
      var req = {};
      var res = {};
      req.entity = {permissions: {}};

      authorize({requiresAuth: true})(req, res, function next(err) {
        if (!err) {
          should.fail();
        }
        done();
      });
    });

    it('should succeed with a user', function(done) {
      var req = {};
      var res = {};
      req.entity = {permissions: {}};
      req.user = {user: {}};

      authorize({requiresAuth: true})(req, res, function next(err) {
        if (err) {
          should.fail();
        }
        done(err);
      });
    });
  });

  describe('permissions', function() {
    it('should pass if you have a translated permission', function(done) {
      var req = {};
      var res = {};
      req.entity = {permissions: {'post.edit': 'fff'}};

      authorize({permission: 'edit'})(req, res, function next(err) {
        if (err) {
          should.fail();
        }
        done(err);
      });
    });

    it('should pass if you have a permission', function(done) {
      var req = {};
      var res = {};
      req.entity = {permissions: {'grant': 'fff'}};

      authorize({permission: 'grant'})(req, res, function next(err) {
        if (err) {
          should.fail();
        }
        done(err);
      });
    });

    it('should fail if you don\'t have a permission', function(done) {
      var req = {};
      var res = {};
      req.entity = {permissions: {'grant': 'fff'}};

      authorize({permission: 'edit'})(req, res, function next(err) {
        if (!err) {
          should.fail();
        }
        done();
      });
    });
  });

  describe('ownUser', function() {
    it('should fail with no user', function(done) {
      var req = {};
      var res = {};
      req.entity = {permissions: {}};

      authorize({ownUser: true})(req, res, function next(err) {
        if (!err) {
          should.fail();
        }
        done();
      });
    });

    it('should succeed with same user', function(done) {
      var req = {};
      var res = {};
      req.entity = {permissions: {}};
      req.user = {user: {path: function() {
        return new SitePath(['wh', 'user']);
      }}};
      req.sitepath = new SitePath(['wh', 'user']);

      authorize({ownUser: true})(req, res, function next(err) {
        if (err) {
          should.fail();
        }
        done(err);
      });
    });

    it('should fail with different user', function(done) {
      var req = {};
      var res = {};
      req.entity = {permissions: {}};
      req.user = {user: {path: function() {
        return new SitePath(['wh', 'user2']);
      }}};
      req.sitepath = new SitePath(['wh', 'user']);

      authorize({ownUser: true})(req, res, function next(err) {
        if (!err) {
          should.fail();
        }
        done();
      });
    });
  });
});
