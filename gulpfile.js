// Gulpfile.js
var gulp = require('gulp')
  , nodemon = require('gulp-nodemon')
  , jshint = require('gulp-jshint')
  , istanbul = require('gulp-istanbul')
  , mocha = require('gulp-mocha');

gulp.task('test', function () {
    return gulp.src('tests/unit/*.js', {read: false})
        .pipe(mocha({}));
});

gulp.task('coverage', function (cb) {
  gulp.src(['lib/**/*.js'])
    .pipe(istanbul()) // Covering files
    .pipe(istanbul.hookRequire()) // Force `require` to return covered files
    .on('finish', function () {
      gulp.src(['tests/unit/*.js'])
        .pipe(mocha())
        .pipe(istanbul.writeReports()) // Creating the reports after tests runned
        .on('end', cb);
    });
});

gulp.task('lint', function () {
  gulp.src('./**/*.js')
    .pipe(jshint())
})

gulp.task('develop', function () {
  nodemon(
    { script: 'lib/front.js', 
      ext: 'js css html', 
      watch: [
        "lib/", 
        "lib/middleware/",
        "scheme/default/",
        "scheme/default/static/"
      ] })
    .on('change', ['lint'])
    .on('restart', function () {
      console.log('restarted!')
    })
})
