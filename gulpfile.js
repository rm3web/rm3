// Gulpfile.js
var gulp = require('gulp')
  , nodemon = require('gulp-nodemon')
  , jshint = require('gulp-jshint')
  , istanbul = require('gulp-istanbul')
  , mocha = require('gulp-mocha')
  , run = require('gulp-run')
  , jscs = require('gulp-jscs')
  , gls = require('gulp-live-server')
  , gutil = require('gulp-util')
  , bower = require('gulp-bower')
  , spawn = require('child_process').spawn
  , clone = require('clone')
  , source = require('vinyl-source-stream')
  , browserify = require('browserify')
  ;

var winston = require('winston');

winston.remove(winston.transports.Console);

var lintable = ['lib/**/*.js', 'tests/**/*.js'];

gulp.task('unit-tests', function (cb) {
  process.env['RM3_PG'] = 'postgresql://wirehead:rm3test@127.0.0.1/rm3unit';
  var unit = gulp.src('tests/unit/*.js', {read: false})
        .pipe(mocha({}))
        .on('end', cb);
});
 
gulp.task('browserify', function() {
    return browserify('./scheme/default/bundles/base.js')
        .bundle()
        //Pass desired output filename to vinyl-source-stream
        .pipe(source('base.js'))
        // Start piping stream to tasks!
        .pipe(gulp.dest('./scheme/default/static/'));
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

gulp.task('casper-coverage', ['casper-users'], function (cb) {
  var ctx = { cwd: process.cwd(),
    env: clone(process.env)
  }
  ctx.env.RM3_PG = 'postgresql://wirehead:rm3test@127.0.0.1/rm3casper'
  var server = spawn('./node_modules/.bin/istanbul', 
    ['cover', '--dir', './coverage/casper', '--handle-sigint', '--', 'lib/front.js'],
    ctx);

  var tests = ['./tests/casper/*'];

  var serverlog = [];

  server.stderr.on('data', function (data) {
    serverlog.push(data);
  });

  server.stdout.on('data', function (data) {
    serverlog.push(data);
  });

  setTimeout(function() {
    var casperChild = spawn('./node_modules/.bin/mocha-casperjs', tests);

    casperChild.stdout.on('data', function (data) {
        gutil.log('CasperJS:', data.toString().slice(0, -1));
    });

    casperChild.on('close', function (code) {
        var success = code === 0; // Will be 1 in the event of failure

        if (success) {
          console.log('Casper tests passed');
        } else {
          console.log('Casper tests failed');
          serverlog.forEach(function(element, index, array) {
            gutil.log('Server:', element.toString());
          });
        }
        console.log('killing server');

        // Do something with success here
        server.kill('SIGINT');
        cb();
    });
  }, 20000);
});

gulp.task('coverage', ['base-coverage', 'casper-coverage'], function(cb) {
  run('./node_modules/.bin/istanbul report lcov text').exec()
    .pipe(gulp.dest('output'))
    .on('end', cb)
    .on('error', gutil.log);
})

gulp.task('coveralls', ['coverage'], function (cb) {
  run('cat ./coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js && rm -rf ./coverage').exec()
    .pipe(gulp.dest('output'))
    .on('end', cb)
    .on('error', gutil.log);
});


gulp.task('jscs', function (cb) {
  gulp.src(lintable)
    .pipe(jscs())
    .on('end', cb);
});

gulp.task('jshint', function (cb) {
  gulp.src(lintable)
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .on('end', cb);
})

gulp.task('bower', function() {
  return bower()
    .pipe(gulp.dest('./bower_components'));
});

gulp.task('lint', ['jshint', 'jscs'])

gulp.task('travis', ['bower', 'browserify', 'lint', 'coveralls'])

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
    .on('change', ['browserify'])
    .on('restart', function () {
      console.log('restarted!')
    })
});

gulp.task('casper-db', function(cb) {
  run('dropdb --if-exists rm3casper && createdb rm3casper').exec()
    .pipe(gulp.dest('output'))
    .on('end', cb);
});

gulp.task('casper-schema', ['casper-db'], function(cb) {
  gulp.src('db-schema.sql')
    .pipe(run('psql rm3casper'))
    .pipe(gulp.dest('output'))
    .on('end', cb);
})

gulp.task('casper-fixtures', ['casper-db', 'casper-schema'], function(cb) {
var ctx = { cwd: process.cwd(),
    env: clone(process.env)
  }
  ctx.env.RM3_PG = 'postgresql://wirehead:rm3test@127.0.0.1/rm3casper'
  gulp.src('tests/page-fixtures/*.json')
    .pipe(run('./bin/rm3load', ctx))
    .pipe(gulp.dest('output'))
    .on('end', cb)
    .on('error', gutil.log);
})

gulp.task('casper-users', ['casper-db', 'casper-schema', 'casper-fixtures'], function(cb) {
var ctx = { cwd: process.cwd(),
    env: clone(process.env)
  }
  ctx.env.RM3_PG = 'postgresql://wirehead:rm3test@127.0.0.1/rm3casper'
  
  var setup = './bin/rm3admin adduser wirehead "Test User" -p "Some profile text" -u http://www.wirewd.com/ -e nobody@wirewd.com --password password'
  + '&& ./bin/rm3admin assign wirehead root'
  + '&& ./bin/rm3admin permit root edit \\*'
  + '&& ./bin/rm3admin permit root delete \\*'
  + '&& ./bin/rm3admin permit root view \\*'
  + '&& ./bin/rm3admin permit nobody view wh.!users'
  run(setup, ctx).exec()
    .pipe(gulp.dest('output'))
    .on('end', cb);
})

gulp.task('casper-tests', ['casper-users'], function(cb) {
  var server = gls.new('lib/front.js', 
    {env: {RM3_PG: 'postgresql://wirehead:rm3test@127.0.0.1/rm3casper'}});

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
          console.log('Casper tests passed');
        } else {
          console.log('Casper tests failed');
        }
        
        console.log('killing server');

        // Do something with success here
        server.stop().then(function() {
          cb();
        });
    });
  }, 2000);

});
