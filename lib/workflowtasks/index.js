var Svgo = require('svgo'),
    svgoInstance = new Svgo(/*{ custom config object }*/);
var BlobStores = require('../blobstores');

var svgo = function(job, cb) {
  var blobstore = BlobStores.getBlobStore('public');
  blobstore.getBlob(job.params.ctx, job.params.path, job.params.filename,
                    job.params.revisionId, function(err, blob) {
    if (err) {
      cb(err);
    }
    svgoInstance.optimize(blob, function(result) {
      if (err) {
        cb(err);
      }
      blobstore.addBlob(job.params.ctx, job.params.path, job.params.svgofilename,
                        job.params.revisionId, false, false, result.data, cb);
    });
  });
};

exports.svgo = svgo;
