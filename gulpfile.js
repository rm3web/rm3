// Gulpfile.js
var gulp = require('gulp')
  , nodemon = require('gulp-nodemon')
  , jshint = require('gulp-jshint')
  , istanbul = require('gulp-istanbul')
  , mocha = require('gulp-mocha')
  , run = require('gulp-run')
  , jscs = require('gulp-jscs')
  , gls = require('gulp-live-server')
  , gutil = require('gulp-util');
  ;

var spawn = require('child_process').spawn;

var lintable = ['lib/**/*.js', 'tests/**/*.js'];

gulp.task('unit-tests', function (cb) {
  process.env['RM3_PG'] = 'postgresql://wirehead:rm3test@127.0.0.1/rm3unit';
  var unit = gulp.src('tests/unit/*.js', {read: false})
        .pipe(mocha({}))
        .on('end', cb);
});

gulp.task('create-db', function (cb){
  run('dropdb --if-exists rm3unit && createdb rm3unit').exec()
    .pipe(gulp.dest('output'))
    .on('end', cb);
});

gulp.task('build-schema', ['create-db'], function (cb){
  gulp.src('db-schema.sql')
    .pipe(run('psql rm3unit'))
    .pipe(gulp.dest('output'))
    .on('end', cb);
});

gulp.task('db-tests', ['create-db', 'build-schema'], function (cb) {
  process.env['RM3_PG'] = 'postgresql://wirehead:rm3test@127.0.0.1/rm3unit';
  var unit = gulp.src('tests/db/*.js', {read: false})
        .pipe(mocha({}))
        .on('end', cb);
});

gulp.task('test', ['unit-tests', 'db-tests']);

gulp.task('coverage', ['create-db', 'build-schema'], function (cb) {
  process.env['RM3_PG'] = 'postgresql://wirehead:rm3test@127.0.0.1/rm3unit';
  gulp.src(['lib/**/*.js'])
    .pipe(istanbul()) // Covering files
    .pipe(istanbul.hookRequire()) // Force `require` to return covered files
    .on('finish', function () {
      gulp.src(['tests/**/*.js'])
        .pipe(mocha())
        .pipe(istanbul.writeReports()) // Creating the reports after tests runned
        .on('end', cb);
    });
});

gulp.task('coveralls', ['create-db', 'build-schema'], function (cb) {
  process.env['RM3_PG'] = 'postgresql://wirehead:rm3test@127.0.0.1/rm3unit';
  gulp.src(['lib/**/*.js'])
    .pipe(istanbul()) // Covering files
    .pipe(istanbul.hookRequire()) // Force `require` to return covered files
    .on('finish', function () {
      gulp.src(['tests/**/*.js'])
        .pipe(mocha())
        .pipe(istanbul.writeReports()) // Creating the reports after tests runned
        .on('end', function() {
          run('cat ./coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js && rm -rf ./coverage').exec()
            .pipe(gulp.dest('output'))
            .on('end', cb);
        });
    });
});


gulp.task('jscs', function (cb) {
  gulp.src(lintable)
    .pipe(jscs())
    .pipe(gulp.dest('src'))
    .on('end', cb);
});

gulp.task('jshint', function (cb) {
  gulp.src(lintable)
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .on('end', cb);
})

gulp.task('lint', ['jshint', 'jscs'])

gulp.task('travis', ['lint', 'coveralls'])

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


gulp.task('casper-tests', function(cb) {
  var server = gls.new('lib/front.js');

  var tests = ['./tests/casper/*'];

  server.start();
  setTimeout(function() {

    var casperChild = spawn('./node_modules/.bin/mocha-casperjs', tests);

    casperChild.stdout.on('data', function (data) {
        gutil.log('CasperJS:', data.toString().slice(0, -1));
    });

    casperChild.on('close', function (code) {
        var success = code === 0; // Will be 1 in the event of failure

        if (success) {
          console.log('sfs');
        } else {
          console.log('ffs');
        }
        console.log('killing server');

        // Do something with success here
        server.stop().then(function() {
          cb();
        });
    });
  }, 2000);

});
