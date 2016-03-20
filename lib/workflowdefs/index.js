var workflowtasks = require('../workflowtasks');

var workflow = module.exports =
{
  "vectorgraphic.svgo.1": {
    name: "vectorgraphic.process.1",
    chain: [{
      name: 'svgo',
      timeout: 30,
      retry: 1,
      body: function(job, cb) {
        return workflowtasks.svgo(job.params.ctx, job.params.path, job.params.filename, 
          job.params.svgofilename, job.params.revisionId, cb);
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
