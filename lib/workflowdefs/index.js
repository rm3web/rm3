var workflowtasks = require('../workflowtasks');

var workflow = module.exports =
{
  "vectorgraphic.process.1": {
    name: "vectorgraphic.process.1",
    chain: [{
      name: 'svgo',
      timeout: 30,
      retry: 1,
      body: function(job, cb) {
        return workflowtasks.svgo(job, cb);
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
