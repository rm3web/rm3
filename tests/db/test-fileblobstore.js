var Conf = require ('../../lib/conf');
var entity = require('../../lib/entity');
var sitepath = require ('sitepath');
var uuid = require('node-uuid');
var should = require('should');
var db = require('../../lib/db');
var os = require('os');
var FileBlobStore = require('../../lib/fileblobstore');

require('mocha-steps');

describe('file blob store', function() {
  var path = new sitepath(['wh', 'fileblobstore']);

  var filepath = {
    path: os.tmpdir(),
    urlroot: 'localhost:'
  };

  var st = new FileBlobStore(filepath, db);

  var revisionId = uuid.v1();

  var buf = new Buffer('test');

  describe('works', function() {
    step('#authorize', function(done) {
      st.authorize(done);
    });

    step('#addBlob', function(done) {
      st.addBlob({}, path.toDottedPath(), 'filename', revisionId, true, true, buf, done);
    });

    step('#getBlobUrl', function(done) {
      st.getBlobUrl({}, path.toDottedPath(), 'filename', revisionId, function(err, blobUrl) {
        blobUrl.should.equal('localhost:' + path.toDottedPath() + '-' + revisionId + '-' + 'filename');
        done(err);
      });
    });

    step('#getBlob', function(done) {
      st.getBlob({}, path.toDottedPath(), 'filename', revisionId, function(err, blob) {
        blob.compare(buf).should.equal(0);
        done(err);
      });
    });

    step('#doesBlobExist', function(done) {
      st.doesBlobExist({}, path.toDottedPath(), 'filename', revisionId, function(err, exist) {
        exist.should.equal(true);
        done(err);
      });
    });

    step('#doesBlobExist where there should be no filename', function(done) {
      st.doesBlobExist({}, path.toDottedPath(), 'badfilename', revisionId, function(err, exist) {
        exist.should.equal(false);
        done(err);
      });
    });

    step('#deleteBlob', function(done) {
      st.deleteBlob({}, path.toDottedPath(), 'filename', revisionId, done);
    });

    step('#doesBlobExist after #deleteBlob', function(done) {
      st.doesBlobExist({}, path.toDottedPath(), 'filename', revisionId, function(err, exist) {
        exist.should.equal(false);
        done(err);
      });
    });

  });
});
