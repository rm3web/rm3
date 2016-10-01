var should = require('chai').should();
var BlobStores = require('../../lib/blobstores');

describe('BlobStores', function() {
  describe('#fetchBlob', function() {
    it('should work as expected', function() {
      var blobstore = {
        doesBlobExist: function(ctx, path, filename, revisionId, next) {
          path.should.equal('path');
          filename.should.equal('filename');
          revisionId.should.equal('revisionId');
          next(null, true)
        },
        getBlobUrl: function(ctx, path, filename, revisionId, next) {
          path.should.equal('path');
          filename.should.equal('filename');
          revisionId.should.equal('revisionId');
          next(null, 'long-path');
        }
      }
      BlobStores.fetchBlob({}, blobstore, 'path', 'filename', 'revisionId', function(err, path) {
        should.not.exist(err);
        path.should.equal('long-path');
      });
    });

    it('should fail if not found', function() {
      var blobstore = {
        doesBlobExist: function(ctx, path, filename, revisionId, next) {
          path.should.equal('path');
          filename.should.equal('filename');
          revisionId.should.equal('revisionId');
          next(null, false)
        },
        getBlobUrl: function(ctx, path, filename, revisionId, next) {
          should.fail();
        }
      }
      BlobStores.fetchBlob({}, blobstore, 'path', 'filename', 'revisionId', function(err, path) {
        should.not.exist(err);
        path.should.equal(false);
      });
    });

    it('should pass errors', function() {
      var blobstore = {
        doesBlobExist: function(ctx, path, filename, revisionId, next) {
          path.should.equal('path');
          filename.should.equal('filename');
          revisionId.should.equal('revisionId');
          next(null, true)
        },
        getBlobUrl: function(ctx, path, filename, revisionId, next) {
          path.should.equal('path');
          filename.should.equal('filename');
          revisionId.should.equal('revisionId');
          next(new Error('fer'));
        }
      }
      BlobStores.fetchBlob({}, blobstore, 'path', 'filename', 'revisionId', function(err, path) {
        should.exist(err);
        err.message.should.equal('fer');
      });
    });
  });
});
