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
  context('#writeStringToBlob', function() {
    var proxy;
    before(function() {
      proxy = proxyquire('../../lib/workflowtasks', {'../blobstores': {
        'getBlobStore': function(category) {
          return {
            addBlob: function(ctx, entityPath, blobPath, revisionId, source, temporary, data, next) {
              next();
            }
          };
        }
      }});
    });
    it('works', function(cb) {
      proxy.writeStringToBlob({}, 'fff', 'fn', 'string', 'revisionId', function(err) {
        cb();
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
