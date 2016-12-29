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

var createDOMPurify = require('dompurify');
var jsdom = require('jsdom');
var window = jsdom.jsdom('', {
  features: {
    FetchExternalResources: false, // disables resource loading over HTTP / filesystem
    ProcessExternalResources: false // do not execute JS within script blocks
  }
}).defaultView;
var DOMPurify = createDOMPurify(window);

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
      var sanitizedBlob = DOMPurify.sanitize(svgoBlob.data);
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

var withTempFile = function(ctx, name, string, next) {
  tmp.file(function _tempFileCreated(err, path, fd, cleanupCallback) {
    if (err) {
      return next(err);
    }
    ctx[name] = path;
    fs.writeSync(fd, string);
    next(null, path, fd, cleanupCallback);
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
      console.log(`child process exited with code ${code}`);
      var err = new Error('child process exited with nonzero code');
      err.code = code;
      err.stdOut = stdOut;
      err.stdErr = stdErr;
      return cb(err);
    }
    ctx[name].stdOut = stdOut;
    ctx[name].stdErr = stdErr;
    cb(null);
  });
};

exports.svgOptimize = svgOptimize;
exports.renderSvgScale = renderSvgScale;
exports.renderSvgNative = renderSvgNative;
exports.renderSvgSquare = renderSvgSquare;
exports.renderJpegScale = renderJpegScale;
exports.renderJpegSquare = renderJpegSquare;
exports.withTempFile = withTempFile;
exports.dangerousDoSpawn = dangerousDoSpawn;
