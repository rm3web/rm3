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

BlobStores.prototype.fetchBlob = function(ctx, blobstore, path, filename, revisionId, cb) {
  blobstore.doesBlobExist(ctx, path, filename, revisionId, function(err, exist) {
    if (exist) {
      blobstore.getBlobUrl(ctx, path, filename, revisionId, function(err, blobpath) {
        if (err) {
          return cb(err);
        }
        return cb(err, blobpath);
      });
    } else {
      return cb(null, false);
    }
  });
};

BlobStores.prototype.fetchBlobBatch = function(ctx, blobstore, path, filenames, revisionId, cb) {
  var self = this;
  async.map(filenames, function(param, cb) {
    self.fetchBlob(ctx, blobstore, path, param, revisionId, function(err, blobpath) {
      if (err) {
        cb(err);
      }
      if (blobpath) {
        cb(err, blobpath);
      } else {
        return cb();
      }
    });
  }, cb);
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
};

BlobStores.prototype.batchAlias = function(ctx, blobstore, path, names, revisionId, source, temporary, oldRevisionId, cb) {
  async.each(names, function(name, next) {
    blobstore.aliasUnchangedBlob(ctx, path, name, revisionId, source, temporary, oldRevisionId, function(err) {
      if (err && err.code === 'ENOENT') {
        return next();
      }
      next(err);
    });
  }, cb);
};

exports = module.exports = new BlobStores();
