var gulp = require('gulp')
  , shell = require('gulp-shell');
 
gulp.task('benchmark', ['test:db:db', 'test:db:schema'], shell.task(['./node_modules/.bin/matcha benchmark/*.js'], {env: {
    RM3_PG: 'postgresql://wirehead:rm3test@127.0.0.1/rm3unit'
  }}));

 