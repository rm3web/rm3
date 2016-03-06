// Gulpfile.js
var gulp = require('gulp')
  , nodemon = require('gulp-nodemon')
  , istanbul = require('gulp-istanbul')
  , mocha = require('gulp-mocha')
  , shell = require('gulp-shell')
  , jscs = require('gulp-jsxcs')
  , jshint = require('gulp-jshint')
  , gutil = require('gulp-util')
  , bower = require('gulp-bower')
  , spawn = require('child_process').spawn
  , clone = require('clone')
  , source = require('vinyl-source-stream')
  , glob = require('glob')
  , imagemin = require('gulp-imagemin')
  , rsvg_convert = require('gulp-rsvg')
  , browserify = require('browserify')
  , async = require('async')
  , path = require('path')
  , rename = require("gulp-rename")
  , csslint = require('gulp-csslint')
  , concat = require('gulp-concat')
  , minifyCss = require('gulp-minify-css')
  ;

require('./tests.js');

  // Load and use polyfill for ECMA-402.
if (!global.Intl) {
  global.Intl = require('intl');
}

var winston = require('winston');

winston.remove(winston.transports.Console);

gulp.task('icon-75', function() {
    return gulp.src('./scheme/default/images/icon-*.svg')
        .pipe(rsvg_convert({width: 75, height:75}))
        .pipe(rename(function (path) {
          path.basename += "-75";
        }))
        .pipe(gulp.dest('./scheme/default/static/images/'));
});

gulp.task('icon-24', function() {
    return gulp.src('./scheme/default/images/icon-*.svg')
        .pipe(rsvg_convert({width: 24, height:24}))
        .pipe(rename(function (path) {
          path.basename += "-24";
        }))
        .pipe(gulp.dest('./scheme/default/static/images/'));
});

gulp.task('cssbundle', function() {
  return gulp.src(['./bower_components/pure/pure.css',
    './node_modules/react-super-select/lib/react-super-select.css',
    './scheme/default/styles/*.css'])
    .pipe(concat('bundle.css'))
    .pipe(minifyCss())
    .pipe(gulp.dest('./scheme/default/static/'));
})

gulp.task('icon', ['icon-75', 'icon-24'], function() {

})

gulp.task('imagemin', function () { 
    return gulp.src('./scheme/default/images/*.svg')
        .pipe(imagemin({}))
        .pipe(gulp.dest('./scheme/default/static/images/'));
});
 
gulp.task('browserify', function(cb) {
  var files = glob.sync('./scheme/default/bundles/*.js', {});
  async.each(files, function(file, next){
    return browserify(file)
      .bundle()
      //Pass desired output filename to vinyl-source-stream
      .pipe(source(path.basename(file)))
      // Start piping stream to tasks!
      .pipe(gulp.dest('./scheme/default/static/bundles/'))
      .on('end', next);
  }, cb)
});

gulp.task('base-coverage', ['create-db', 'build-schema'], function (cb) {
  process.env['RM3_PG'] = 'postgresql://wirehead:rm3test@127.0.0.1/rm3unit';
  gulp.src(['lib/**/*.js'])
    .pipe(istanbul()) // Covering files
    .pipe(istanbul.hookRequire()) // Force `require` to return covered files
    .on('finish', function () {
      gulp.src(['tests/unit/*.js', 'tests/db/*.js'])
        .pipe(mocha())
        .pipe(istanbul.writeReports({
            dir: './coverage/unit',
            reportOpts: { dir: './coverage/unit' }
          })) // Creating the reports
        .on('end', cb);
    });
});

gulp.task('coverage-merge', shell.task([
  './node_modules/.bin/istanbul report lcov text'
]))

gulp.task('coveralls', shell.task([
  'cat ./coverage/lcov.info |  ./node_modules/codecov.io/bin/codecov.io.js'
]))

gulp.task('bower', function() {
  return bower()
    .pipe(gulp.dest('./bower_components'));
});


gulp.task('travis', ['prepublish', 'lint'])

gulp.task('prepublish', ['bower', 'imagemin', 'cssbundle', 'icon', 'browserify'])

gulp.task('develop', function () {
  nodemon(
    { script: 'bin/rm3front', 
      ext: 'js jsx css html', 
      tasks: ['browserify', 'cssbundle'],
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

