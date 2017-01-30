var workflowtasks = require('../../lib/workflowtasks');
var should = require('chai').should();
var fs = require('fs');
var proxyquire =  require('proxyquire');

describe('workflowtasks', function() {
  it('#withTempFile should work as expected', function(cb) {
    var ctx = {};
    workflowtasks.withTempFile(ctx, 'abc', 'abcString', function(err, path, fd, cleanupCallback) {
      if (err) {
        should.fail();
        cb(err);
      }
      var buff = fs.readFileSync(path, 'utf8');
      buff.should.equal('abcString');
      cleanupCallback();
      ctx.abc.should.equal(path);
      cb(err);
    });
  });
  it('#withTempFileName should work as expected', function(cb) {
    var ctx = {};
    workflowtasks.withTempFileName(ctx, 'abc', function(err, path) {
      if (err) {
        should.fail();
        cb(err);
      }
      fs.writeFileSync(path, 'abcString');
      var buff = fs.readFileSync(path, 'utf8');
      buff.should.equal('abcString');
      ctx.abc.should.equal(path);
      fs.unlinkSync(path);
      cb(err);
    });
  });
  context('#writeStringToBlob', function() {
    var proxy;
    before(function() {
      proxy = proxyquire('../../lib/workflowtasks', {'../blobstores': {
        'getBlobStore': function(category) {
          return {
            addBlob: function(ctx, entityPath, blobPath, revisionId, source, temporary, data, next) {
              data.should.equal('string');
              next();
            }
          };
        }
      }});
    });
    it('works', function(cb) {
      proxy.writeStringToBlob({}, 'fff', 'fn', 'revisionId', 'string', function(err) {
        cb();
      });
    });
  });

  context('#writeFileToBlob', function() {
    var proxy;
    before(function() {
      proxy = proxyquire('../../lib/workflowtasks', {'../blobstores': {
        'getBlobStore': function(category) {
          return {
            addBlob: function(ctx, entityPath, blobPath, revisionId, source, temporary, data, next) {
              data.toString().should.equal('string');
              next();
            }
          };
        }
      }});
    });
    it('works', function(cb) {
      var ctx = {};
      workflowtasks.withTempFileName(ctx, 'abc', function(err, path) {
        fs.writeFileSync(path, 'string');
        proxy.writeFileToBlob({}, 'fff', 'fn', 'revisionId', path, function(err) {
          cb();
        });
      });
    });
  });

  context('#dangerousDoSpawn', function() {
    it('should succeed with true', function(cb) {
      var ctx = {};
      workflowtasks.dangerousDoSpawn(ctx, 'true', 'true', [], function(err) {
        if (err) {
          should.fail();
          cb(err);
        }
        ctx.true.stdOut.should.equal('');
        ctx.true.stdErr.should.equal('');
        cb(err);
      });
    });

    it('should succeed with echo', function(cb) {
      var ctx = {};
      workflowtasks.dangerousDoSpawn(ctx, 'echo', 'echo', ['blah'], function(err) {
        if (err) {
          should.fail();
          cb(err);
        }
        ctx.echo.stdOut.should.equal('blah\n');
        ctx.echo.stdErr.should.equal('');
        cb(err);
      });
    });

    it('should fail with false', function(cb) {
      var ctx = {};
      workflowtasks.dangerousDoSpawn(ctx, 'false', 'false', [], function(err) {
        if (err) {
          cb();
        } else {
          should.fail();
        }
      });
    });
  });
});
