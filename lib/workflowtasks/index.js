var Svgo = require('svgo'),
    svgoInstance = new Svgo(/*{ custom config object }*/);
var BlobStores = require('../blobstores');
var Rsvg = require('librsvg').Rsvg;
var imageScale = require('../imagescale');
var async = require('async');
var sharp = require('sharp');
var tmp = require('tmp');
var fs = require('fs');
var spawn = require('child_process').spawn;
var sanitize = require('../sanitize');
var Buffer = require('buffer').Buffer;

var generateSvgBar = function(width, height, slug) {
  var svgStr = '<?xml version="1.0" encoding="utf-8"?>\
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd" >\
<svg version="1.1"\
 xmlns="http://www.w3.org/2000/svg"\
 x="0px" y="0px" width="' + width + 'px" height="' + (height + 16) +
 'px" viewBox="0 ' + height + ' ' + width + '" ' +
 'xml:space="preserve">\
<defs>\
</defs>\
<text x="0.5" y="' + (height + 12) + '" fill="#FFFFFF" font-family="sans-serif" font-size="12px">' + slug + ' </text>\
</svg>';
  var overlaySvg = Buffer.from(svgStr);
  return overlaySvg;
};

var svgOptimize = function(ctx, path, filename, svgofilename, revisionId, cb) {
  var blobstore = BlobStores.getBlobStore('public');
  blobstore.getBlob(ctx, path, filename, revisionId, function(err, blob) {
    if (err) {
      return cb(err);
    }
    svgoInstance.optimize(blob, function(svgoBlob) {
      if (svgoBlob.error) {
        return cb(new Error(svgoBlob.error));
      }
      var sanitizedBlob = sanitize.sanitizeXML(svgoBlob.data);
      blobstore.addBlob(ctx, path, svgofilename, revisionId, false, false, sanitizedBlob, cb);
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

var renderJpegScale = function(ctx, path, filename, scalefilename, revisionId, sizes, inBlobstoreSet, slug, cb) {
  var inBlobstore = BlobStores.getBlobStore(inBlobstoreSet);
  var outBlobstore = BlobStores.getBlobStore('public');
  inBlobstore.getBlob(ctx, path, filename, revisionId, function(err, blob) {
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
      var intermediate = instance.resize(newSize.width, newSize.height)
        .jpeg()
        .sharpen();
      if (slug && param.size > 100) {
        var overlay = generateSvgBar(newSize.width, newSize.height, slug);
        intermediate = intermediate.extend({top: 0, bottom: 16, left: 0, right: 0})
          .overlayWith(overlay);
      }
      intermediate.toBuffer(function(err, buffer, info) {
        outBlobstore.addBlob(ctx, path, scalefilename + '-' + param.suffix + '.jpg',
                        revisionId, false, false, buffer, next);
      });
    }, cb);
  });
};

var renderJpegSquare = function(ctx, path, filename, scalefilename, revisionId, sizes, inBlobstoreSet, cb) {
  var inBlobstore = BlobStores.getBlobStore(inBlobstoreSet);
  var outBlobstore = BlobStores.getBlobStore('public');
  inBlobstore.getBlob(ctx, path, filename, revisionId, function(err, blob) {
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
          outBlobstore.addBlob(ctx, path, scalefilename + '-' + param.suffix + '.jpg',
                          revisionId, false, false, buffer, next);
        });
    }, cb);
  });
};

var withTempFile = function(ctx, name, string, next) {
  tmp.file(function _tempFileCreated(err, path, fd, cleanupCallback) {
    if (err) {
      return next(err);
    }
    ctx[name] = path;
    fs.write(fd, string, function(err, written, buffer) {
      if (err) {
        return next(err);
      }
      next(null, path, fd, cleanupCallback);
    });
  });
};

var withTempFileName = function(ctx, name, next) {
  tmp.tmpName(function _tempFileCreated(err, path) {
    if (err) {
      return next(err);
    }
    ctx[name] = path;
    next(null, path);
  });
};

var writeStringToBlob = function(ctx, path, filename, revisionId, string, next) {
  var blobstore = BlobStores.getBlobStore('public');
  blobstore.addBlob(ctx, path, filename, revisionId, false, false, string, next);
};

var writeFileToBlob = function(ctx, path, filename, revisionId, file, next) {
  var blobstore = BlobStores.getBlobStore('public');
  fs.readFile(file, function(err, string) {
    if (err) {
      return next(err);
    }
    blobstore.addBlob(ctx, path, filename, revisionId, false, false, string, next);
  });
};

var dangerousDoSpawn = function(ctx, name, path, params, cb) {
  var child = spawn(path, params);
  var stdOut = '';
  var stdErr = '';

  child.stdout.on('data', function(data) {
    stdOut = stdOut + data;
  });

  child.stderr.on('data', function(data) {
    stdErr = stdErr + data;
  });
  ctx[name] = {};

  child.on('close', function(code) {
    if (code !== 0) {
      var err = new Error('child process exited with nonzero code');
      err.code = code;
      err.stdOut = stdOut;
      err.stdErr = stdErr;
      return cb(err, stdOut, stdErr);
    }
    ctx[name].stdOut = stdOut;
    ctx[name].stdErr = stdErr;
    cb(null, stdOut, stdErr);
  });
};

exports.svgOptimize = svgOptimize;
exports.renderSvgScale = renderSvgScale;
exports.renderSvgNative = renderSvgNative;
exports.renderSvgSquare = renderSvgSquare;
exports.renderJpegScale = renderJpegScale;
exports.renderJpegSquare = renderJpegSquare;
exports.withTempFile = withTempFile;
exports.withTempFileName = withTempFileName;
exports.dangerousDoSpawn = dangerousDoSpawn;
exports.writeStringToBlob = writeStringToBlob;
exports.writeFileToBlob = writeFileToBlob;
