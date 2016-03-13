var workflow = module.exports =
{
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
