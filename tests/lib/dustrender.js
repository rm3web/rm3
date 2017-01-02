var should = require('chai').should();

var dustRender = function(dust, template, templateName, vars, match, cb) {
  var trueTemplate = dust.compile(template, templateName);
  dust.loadSource(trueTemplate);
  dust.render(templateName, vars, function(err, output) {
    if (err) {
      should.fail();
    } else {
      output.should.equal(match);
    }
    cb(err);
  });
};

module.exports = exports = dustRender;
