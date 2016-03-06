var gulp = require('gulp')
  , mocha = require('gulp-mocha')

gulp.task('unit-tests', function () {
  process.env['RM3_PG'] = 'postgresql://wirehead:rm3test@127.0.0.1/rm3unit';
  return gulp.src('tests/unit/*.js', {read: false})
        .pipe(mocha({}));
});