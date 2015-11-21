var async = require('async');

var phases = {};

function addDefaultPhase(phase, phaseFunct) {
  phases[phase] = [phaseFunct];
}

function addToPhase(phase, phaseFunct) {
  phases[phase].push(phaseFunct);
}

function runPhase(phase, next) {
  async.series(phases[phase],next);
}

function replaceAllInPhase(phase, phaseFunct) {
  phases[phase] = [phaseFunct];
}

exports.addDefaultPhase = addDefaultPhase;
exports.addToPhase = addToPhase;
exports.runPhase = runPhase;
exports.replaceAllInPhase = replaceAllInPhase;
