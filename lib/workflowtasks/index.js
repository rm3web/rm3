var Svgo = require('svgo'),
    svgoInstance = new Svgo(/*{ custom config object }*/);
var BlobStores = require('../blobstores');

var svgo = function(ctx, path, filename, svgofilename, revisionId, cb) {
  var blobstore = BlobStores.getBlobStore('public');
  blobstore.getBlob(ctx, path, filename,
                    revisionId, function(err, blob) {
    if (err) {
      cb(err);
    }
    svgoInstance.optimize(blob, function(result) {
      if (err) {
        cb(err);
      }
      blobstore.addBlob(ctx, path, svgofilename, revisionId, false, false, result.data, cb);
    });
  });
};

exports.svgo = svgo;
