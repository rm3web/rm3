var imageScale = require ('../../lib/imagescale');
var should = require('should');
var jsc = require("jsverify");

describe("#scaleBestFit", function() {
  it("should always grow to fit the desired box", function() {
    var property = jsc.forall(jsc.integer(1,2000), jsc.integer(1,2000),
                              jsc.integer(1,1000),function(width, height, maxsize) {
      var fit = imageScale.scaleBestFit(width, height, maxsize);
      var widthPass = fit.width == maxsize;
      var heightPass = fit.height == maxsize;
      return (widthPass || heightPass);
    });
    jsc.assert(property, {size: 2000, tests: 4000});
  });

  it("should always match inside of the desired box", function() {
    var property = jsc.forall(jsc.integer(1,2000), jsc.integer(1,2000),
                              jsc.integer(1,1000), function(width, height, maxsize) {
      var fit = imageScale.scaleBestFit(width, height, maxsize);
      var widthPass = fit.width <= maxsize;
      var heightPass = fit.height <= maxsize;
      return widthPass && heightPass;
    });
    jsc.assert(property, {size: 2000, tests: 4000});
  });

  it("should match aspect ratios within an error bound", function() {
    /* This is a math check; it gets a bit fuzzy because of floating point path
    */
    var property = jsc.forall(jsc.integer(75,1000), jsc.integer(75,1000),
                              jsc.integer(250,500), function(width, height, maxsize) {
      var fit = imageScale.scaleBestFit(width, height, maxsize);
      var scaledAspect = fit.width / fit.height;
      var aspect = width / height;
      var percentOff = Math.abs(1 - (aspect / scaledAspect));
      return (percentOff <= 0.08);
    });
    jsc.assert(property, {size: 1000, tests: 4000});
  });
});
