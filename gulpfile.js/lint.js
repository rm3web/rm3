var gulp = require('gulp')
  , jscs = require('gulp-jsxcs')
  , jshint = require('gulp-jshint')
  , csslint = require('gulp-csslint');

var lintable = ['lib/**/*.js', 'tests/**/*.js', 'lib/**/*.jsx',];

gulp.task('jscs', function () {
  return gulp.src(lintable)
    .pipe(jscs());
});

gulp.task('jshint', function () {
  return gulp.src(lintable)
    .pipe(jshint({ linter: require('jshint-jsx').JSXHINT }))
    .pipe(jshint.reporter('default'));
})

gulp.task('csslint', function() {
  gulp.src('scheme/default/styles/*.css')
    .pipe(csslint())
    .pipe(csslint.reporter());
});

gulp.task('lint', ['jshint', 'jscs', 'csslint'])