// Gulpfile.js
var gulp = require('gulp')
  , nodemon = require('gulp-nodemon')
  , shell = require('gulp-shell')
  , bower = require('gulp-bower')
  , runSequence = require('run-sequence')
  ;

require('./tests.js');
require('./lint.js');
require('./bundle.js');
require('./benchmark.js');

  // Load and use polyfill for ECMA-402.
if (!global.Intl) {
  global.Intl = require('intl');
}

var winston = require('winston');

winston.remove(winston.transports.Console);

gulp.task('coveralls', shell.task([
  'cat ./coverage/lcov.info |  ./node_modules/codecov.io/bin/codecov.io.js'
]))

gulp.task('bower', function() {
  return bower()
    .pipe(gulp.dest('./bower_components'));
});


gulp.task('travis', ['prepublish', 'lint'])

gulp.task('prepublish', function(callback) {
  runSequence('bower',
              'imagemin',
              'cssbundle',
              'icon',
              'browserify',
              callback);
});

gulp.task('develop', function () {
  nodemon(
    { script: 'bin/rm3front', 
      ext: 'js jsx css html', 
      tasks: ['cssbundle'],
      watch: [
        "lib/", 
        "lib/middleware/",
        "scheme/default/",
        "scheme/default/layouts/",
        "scheme/default/bundles/",
        "scheme/default/partials/",
        "scheme/default/sections/",
        "scheme/default/static/"
      ] })
    .on('restart', function () {
      console.log('restarted!')
    })
});

