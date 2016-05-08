var Svgo = require('svgo'),
    svgoInstance = new Svgo(/*{ custom config object }*/);
var BlobStores = require('../blobstores');
var Rsvg = require('librsvg').Rsvg;
var imageScale = require('../imagescale');
var async = require('async');
var sharp = require('sharp');

var svgOptimize = function(ctx, path, filename, svgofilename, revisionId, cb) {
  var blobstore = BlobStores.getBlobStore('public');
  blobstore.getBlob(ctx, path, filename, revisionId, function(err, blob) {
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
  blobstore.getBlob(ctx, path, filename, revisionId, function(err, blob) {
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
  blobstore.getBlob(ctx, path, filename, revisionId, function(err, blob) {
    if (err) {
      return cb(err);
    }
    var scaleSizes = [
      {size: 100, suffix: 't'},
      {size: 240, suffix: 's'},
      {size: 500, suffix: 'm'},
      {size: 1024, suffix: 'l'},
      {size: 2048, suffix: 'k'}
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

var renderSvgSquare = function(ctx, path, filename, rsvgfilename, revisionId, sizes, cb) {
  var blobstore = BlobStores.getBlobStore('public');
  blobstore.getBlob(ctx, path, filename, revisionId, function(err, blob) {
    if (err) {
      return cb(err);
    }
    var scaleSizes = [
      {size: 75, suffix: 'sq'},
      {size: 150, suffix: 'st'}
    ];
    var svg = new Rsvg(blob);
    async.eachSeries(scaleSizes, function(param, next) {
      var result = svg.render({format: 'png', width: param.size, height: param.size});
      blobstore.addBlob(ctx, path, rsvgfilename + '-' + param.suffix + '.png',
                        revisionId, false, false, result.data, next);
    }, cb);
  });
};

var renderJpegScale = function(ctx, path, filename, scalefilename, revisionId, sizes, cb) {
  var blobstore = BlobStores.getBlobStore('public');
  blobstore.getBlob(ctx, path, filename, revisionId, function(err, blob) {
    if (err) {
      return cb(err);
    }
    var scaleSizes = [
      {size: 100, suffix: 't'},
      {size: 240, suffix: 's'},
      {size: 500, suffix: 'm'},
      {size: 1024, suffix: 'l'},
      {size: 2048, suffix: 'k'}
    ];
    var jpg = sharp(blob);
    async.eachSeries(scaleSizes, function(param, next) {
      var instance = jpg.clone();
      var newSize = imageScale.scaleBestFit(sizes.width, sizes.height, param.size);
      instance.resize(newSize.width, newSize.height)
        .jpeg()
        .sharpen()
        .toBuffer(function(err, buffer, info) {
          blobstore.addBlob(ctx, path, scalefilename + '-' + param.suffix + '.jpg',
                          revisionId, false, false, buffer, next);
        });
    }, cb);
  });
};

var renderJpegSquare = function(ctx, path, filename, scalefilename, revisionId, sizes, cb) {
  var blobstore = BlobStores.getBlobStore('public');
  blobstore.getBlob(ctx, path, filename, revisionId, function(err, blob) {
    if (err) {
      return cb(err);
    }
    var scaleSizes = [
      {size: 75, suffix: 'sq'},
      {size: 150, suffix: 'st'}
    ];
    var jpg = sharp(blob);
    async.eachSeries(scaleSizes, function(param, next) {
      var instance = jpg.clone();
      instance.resize(param.size, param.size)
        .jpeg()
        .sharpen()
        .toBuffer(function(err, buffer, info) {
          blobstore.addBlob(ctx, path, scalefilename + '-' + param.suffix + '.jpg',
                          revisionId, false, false, buffer, next);
        });
    }, cb);
  });
};

exports.svgOptimize = svgOptimize;
exports.renderSvgScale = renderSvgScale;
exports.renderSvgNative = renderSvgNative;
exports.renderSvgSquare = renderSvgSquare;
exports.renderJpegScale = renderJpegScale;
exports.renderJpegSquare = renderJpegSquare;
