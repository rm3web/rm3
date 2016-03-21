var async = require('async');

var BlobStores = function() {
  this._stores = {};
};

BlobStores.prototype.register = function(category, store) {
  this._stores[category] = store;
};

BlobStores.prototype.getBlobStore = function(category) {
  return this._stores[category];
};

BlobStores.prototype.batchDelete = function(ctx, blobstore, path, names, revisionId, cb) {
  async.each(names, function(name, next) {
    blobstore.deleteBlob(ctx, path, name, revisionId, function(err) {
      if (err && err.code === 'ENOENT') {
        return next();
      }
      next(err);
    });
  }, cb);
}

exports = module.exports = new BlobStores();
