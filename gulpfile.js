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
  , glob = require('glob')
  , imagemin = require('gulp-imagemin')
  , rsvg_convert = require('gulp-rsvg')
  , browserify = require('browserify')
  , async = require('async')
  , path = require('path')
  , rename = require("gulp-rename")
  ;

var winston = require('winston');

winston.remove(winston.transports.Console);

var lintable = ['lib/**/*.js', 'tests/**/*.js'];

gulp.task('unit-tests', function () {
  process.env['RM3_PG'] = 'postgresql://wirehead:rm3test@127.0.0.1/rm3unit';
  return gulp.src('tests/unit/*.js', {read: false})
        .pipe(mocha({}));
});

gulp.task('icon', function() {
    return gulp.src('./scheme/default/images/icon-*.svg')
        .pipe(rsvg_convert({width: 75, height:75}))
        .pipe(rename(function (path) {
          path.basename += "-75";
        }))
        .pipe(gulp.dest('./scheme/default/static/images/'));
});

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

gulp.task('create-db', function (){
  return run('dropdb --if-exists rm3unit && createdb rm3unit').exec()
});

gulp.task('build-schema', ['create-db'], function () {
  return gulp.src('db-schema.sql')
    .pipe(run('psql rm3unit'));
});

gulp.task('db-tests', ['create-db', 'build-schema'], function () {
  process.env['RM3_PG'] = 'postgresql://wirehead:rm3test@127.0.0.1/rm3unit';
  return gulp.src('tests/db/*.js', {read: false})
        .pipe(mocha({}));
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

gulp.task('coverage', ['base-coverage', 'casper-coverage'], function() {
  return run('./node_modules/.bin/istanbul report lcov text').exec();
})

gulp.task('coveralls', ['coverage'], function () {
  return run('cat ./coverage/lcov.info |  ./node_modules/codecov.io/bin/codecov.io.js').exec();
});


gulp.task('jscs', function () {
  return gulp.src(lintable)
    .pipe(jscs());
});

gulp.task('jshint', function () {
  return gulp.src(lintable)
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
})

gulp.task('bower', function() {
  return bower()
    .pipe(gulp.dest('./bower_components'));
});

gulp.task('lint', ['jshint', 'jscs'])

gulp.task('travis', ['bower', 'imagemin', 'icon', 'browserify', 'lint', 'coveralls'])

gulp.task('develop', function () {
  nodemon(
    { script: 'lib/front.js', 
      ext: 'js jsx css html', 
      watch: [
        "lib/", 
        "lib/middleware/",
        "scheme/default/",
        "scheme/default/layouts/",
        "scheme/default/partials/",
        "scheme/default/sections/",
        "scheme/default/static/"
      ] })
    .on('change', ['browserify'])
    .on('restart', function () {
      console.log('restarted!')
    })
});

gulp.task('casper-db', function() {
  return run('dropdb --if-exists rm3casper && createdb rm3casper').exec();
});

gulp.task('casper-schema', ['casper-db'], function() {
  return gulp.src('db-schema.sql')
    .pipe(run('psql rm3casper'));
})

gulp.task('casper-fixtures', ['casper-db', 'casper-schema'], function() {
var ctx = { cwd: process.cwd(),
    env: clone(process.env)
  }
  ctx.env.RM3_PG = 'postgresql://wirehead:rm3test@127.0.0.1/rm3casper'
  return gulp.src('tests/page-fixtures/*.json')
    .pipe(run('./bin/rm3load', ctx))
})

gulp.task('casper-users', ['casper-db', 'casper-schema', 'casper-fixtures'], function() {
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
  return run(setup, ctx).exec();
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
