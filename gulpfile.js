// Gulpfile.js
var gulp = require('gulp')
  , nodemon = require('gulp-nodemon')
  , jshint = require('gulp-jshint')

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
