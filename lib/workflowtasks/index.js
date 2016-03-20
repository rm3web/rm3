var Svgo = require('svgo'),
    svgoInstance = new Svgo(/*{ custom config object }*/);
var BlobStores = require('../blobstores');
var Rsvg = require('librsvg').Rsvg;
var imageScale = require('../imagescale');
var async = require('async');

var svgOptimize = function(ctx, path, filename, svgofilename, revisionId, cb) {
  var blobstore = BlobStores.getBlobStore('public');
  blobstore.getBlob(ctx, path, filename,
                    revisionId, function(err, blob) {
    if (err) {
      return cb(err);
    }
    svgoInstance.optimize(blob, function(result) {
      if (err) {
        return cb(err);
      }
      blobstore.addBlob(ctx, path, svgofilename, revisionId, false, false, result.data, cb);
    });
  });
};

var renderSvgNative = function(ctx, path, filename, rsvgfilename, revisionId, sizes, cb) {
  var blobstore = BlobStores.getBlobStore('public');
  blobstore.getBlob(ctx, path, filename,
                    revisionId, function(err, blob) {
    if (err) {
      return cb(err);
    }
    var svg = new Rsvg(blob);
    var result = svg.render({format: 'png', width: sizes.width, height: sizes.height});
    blobstore.addBlob(ctx, path, rsvgfilename + '.png',
                      revisionId, false, false, result.data, cb);
  });
};

var renderSvgScale = function(ctx, path, filename, rsvgfilename, revisionId, sizes, cb) {
  var blobstore = BlobStores.getBlobStore('public');
  blobstore.getBlob(ctx, path, filename,
                    revisionId, function(err, blob) {
    if (err) {
      return cb(err);
    }
    var scaleSizes = [
      {size: 100, suffix: 't'},
      {size: 240, suffix: 's'},
      {size: 500, suffix: 'm'},
      {size: 1024, suffix: 'l'},
      {size: 2048, suffix: 'k'},
    ];
    var svg = new Rsvg(blob);
    async.eachSeries(scaleSizes, function(param, next) {
      var newSize = imageScale.scaleBestFit(sizes.width, sizes.height, param.size);
      var result = svg.render({format: 'png', width: newSize.width, height: newSize.height});
      blobstore.addBlob(ctx, path, rsvgfilename + '-' + param.suffix + '.png',
                        revisionId, false, false, result.data, next);
    }, cb);
  });
};

exports.svgOptimize = svgOptimize;
exports.renderSvgScale = renderSvgScale;
exports.renderSvgNative = renderSvgNative;
