var update = require ('./update'),
    logging = require('./logging'),
    query = require('./query'),
    fs = require('fs'),
    path = require('path');

function scramblePath(entityPath, revisionId, blobPath) {
  return entityPath + '-' + revisionId + '-' + blobPath;
}

var FileBlobStore = function(config, db) {
  this._config = config;
  this._db = db;
};

FileBlobStore.prototype.authorize = function(next) {
  next();
};

FileBlobStore.prototype.addBlob = function(ctx, entityPath, blobPath, revisionId, source, temporary, data, next) {
  var self = this;
  var urlPath = scramblePath(entityPath, revisionId, blobPath);
  var filePath = path.join(this._config.path, urlPath);
  fs.writeFile(filePath, data, function(err) {
    update.addBlob(self._db, ctx, 'fileblobstore', entityPath, blobPath, revisionId, source,
      temporary, {filePath: filePath, urlPath: urlPath}, next);
  });
};

FileBlobStore.prototype.aliasUnchangedBlob = function(ctx, entityPath, blobPath, revisionId, source, temporary, oldRevisionId, next) {
  var self = this;
  var urlPath = scramblePath(entityPath, revisionId, blobPath);
  var filePath = path.join(this._config.path, urlPath);
  update.addBlob(self._db, ctx, 'fileblobstore', entityPath, blobPath, revisionId, source,
    temporary, {filePath: filePath, alias: oldRevisionId, urlPath: urlPath}, next);
};

FileBlobStore.prototype.getBlob = function(ctx, entityPath, blobPath, revisionId, next) {
  var self = this;
  query.findBlob(this._db, ctx, 'fileblobstore', entityPath, blobPath, revisionId, function(err, details) {
    var filePath = details.filePath;
    fs.readFile(filePath, next);
  });
};

FileBlobStore.prototype.getBlobUrl = function(ctx, entityPath, blobPath, revisionId, next) {
  var self = this;
  query.findBlob(this._db, ctx, 'fileblobstore', entityPath, blobPath, revisionId, function(err, details) {
    var urlPath = self._config.urlroot + details.urlPath;
    next(null, urlPath);
  });
};

FileBlobStore.prototype.doesBlobExist = function(ctx, entityPath, blobPath, revisionId, next) {
  var filePath = path.join(this._config.path, scramblePath(entityPath, revisionId, blobPath));
  fs.stat(filePath, function(err) {
    if (err) {
      next(false);
    } else {
      next(true);
    }
  });
};

FileBlobStore.prototype.deleteBlob = function(ctx, entityPath, blobPath, revisionId, next) {
  var filePath = path.join(this._config.path, scramblePath(entityPath, revisionId, blobPath));
  update.deleteBlob(this._db, ctx, 'fileblobstore', entityPath, blobPath, revisionId, function(err) {
    if (err) {
      return next(err);
    }
    fs.unlink(filePath, next);
  });
};

exports = module.exports = FileBlobStore;
