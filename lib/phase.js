var async = require('async');

var phases = {};

function addDefaultPhase(phase, phaseFunct) {
  phases[phase] = [phaseFunct];
}

function addToPhase(phase, phaseFunct) {
  phases[phase].push(phaseFunct);
}

function runPhase(phase, app, next) {
  var boundFunctions = [];
  phases[phase].forEach(function(element) {
    boundFunctions.push(element.bind(this, app));
  });
  async.series(boundFunctions,next);
}

function replaceAllInPhase(phase, phaseFunct) {
  phases[phase] = [phaseFunct];
}

exports.addDefaultPhase = addDefaultPhase;
exports.addToPhase = addToPhase;
exports.runPhase = runPhase;
exports.replaceAllInPhase = replaceAllInPhase;
