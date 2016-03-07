var gulp = require('gulp')
  , bower = require('gulp-bower')
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
  , cleanCSS = require('gulp-clean-css')
  ;

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
    .pipe(cleanCSS())
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
