var BlobStores = function() {
  this._stores = {};
};

BlobStores.prototype.register = function(category, store) {
  this._stores[category] = store;
};

BlobStores.prototype.getBlobStore = function(category) {
  return this._stores[category];
};

exports = module.exports = new BlobStores();
