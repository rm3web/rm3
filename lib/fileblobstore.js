var update = require ('./update'),
    logging = require('./logging'),
    query = require('./query'),
    fs = require('fs'),
    path = require('path');

var FileBlobStore = function(config, db) {
  this._config = config;
  this._db = db;
};

FileBlobStore.prototype.authorize = function(next) {
  next();
};

FileBlobStore.prototype.addBlob = function(ctx, entityPath, blobPath, revisionId, source, temporary, data, next) {
  var self = this;
  var filePath = path.join(this._config.path, entityPath + '-' + revisionId + '-' + blobPath);
  fs.writeFile(filePath, data, function(err) {
    update.addBlob(self._db, ctx, 'fileblobstore', entityPath, blobPath, revisionId, source,
      temporary, {path: filePath}, next);
  });
};

FileBlobStore.prototype.getBlob = function(ctx, entityPath, blobPath, revisionId, next) {
  var self = this;
  var filePath = path.join(this._config.path, entityPath + '-' + revisionId + '-' + blobPath);
  fs.readFile(filePath, next);
};

FileBlobStore.prototype.getBlobUrl = function(ctx, entityPath, blobPath, revisionId, next) {
  next(null, this._config.urlroot + entityPath + '-' + revisionId + '-' + blobPath);
};

FileBlobStore.prototype.deleteBlob = function(ctx, entityPath, blobPath, revisionId, next) {
  update.deleteBlob(this._db, ctx, 'fileblobstore', entityPath, blobPath, revisionId, next);
};

exports = module.exports = FileBlobStore;
