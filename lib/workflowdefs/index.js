var workflowtasks = require('../workflowtasks');

var workflow = module.exports =
{
  "vectorgraphic.process.1": {
    name: "vectorgraphic.process.1",
    chain: [{
      name: 'svgOptimize',
      timeout: 30,
      retry: 1,
      body: function(job, cb) {
        return workflowtasks.svgOptimize(job.params.ctx, job.params.path, job.params.filename,
          job.params.svgofilename, job.params.revisionId, cb);
      }
    },
    {
      name: 'renderSvgScale',
      timeout: 30,
      retry: 1,
      body: function(job, cb) {
        return workflowtasks.renderSvgScale(job.params.ctx, job.params.path, job.params.filename,
          job.params.rsvgfilename, job.params.revisionId, job.params.sizes, cb);
      }
    },
    {
      name: 'renderSvgNative',
      timeout: 30,
      retry: 1,
      body: function(job, cb) {
        return workflowtasks.renderSvgNative(job.params.ctx, job.params.path, job.params.filename,
          job.params.rsvgfilename, job.params.revisionId, job.params.sizes, cb);
      }
    },
    {
      name: 'renderSvgSquare',
      timeout: 30,
      retry: 1,
      body: function(job, cb) {
        return workflowtasks.renderSvgSquare(job.params.ctx, job.params.path, job.params.filename,
          job.params.rsvgfilename, job.params.revisionId, job.params.sizes, cb);
      }
    }],
    timeout: 180,
    onerror: []
  },
  "photo.process.1": {
    name: "photo.process.1",
    chain: [{
      name: 'renderJpegScale',
      timeout: 30,
      retry: 1,
      body: function(job, cb) {
        return workflowtasks.renderJpegScale(job.params.ctx, job.params.path, job.params.filename,
          job.params.scalefilename, job.params.revisionId, job.params.sizes, cb);
      }
    },
    {
      name: 'renderJpegSquare',
      timeout: 30,
      retry: 1,
      body: function(job, cb) {
        return workflowtasks.renderJpegSquare(job.params.ctx, job.params.path, job.params.filename,
          job.params.scalefilename, job.params.revisionId, job.params.sizes, cb);
      }
    }],
    timeout: 180,
    onerror: []
  },
  "dummy": {
    name: 'dummy',
    chain: [{
      name: 'Dummy task',
      timeout: 30,
      retry: 1,
      body: function(job, cb) {
        return cb(null, 'dummy task ran');
      }
    }],
    timeout: 180,
    onerror: []
  }
};
