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

  // Load and use polyfill for ECMA-402.
if (!global.Intl) {
  global.Intl = require('intl');
}


var winston = require('winston');

winston.remove(winston.transports.Console);

var lintable = ['lib/**/*.js', 'tests/**/*.js', 'lib/**/*.jsx',];
var casperTests = ['./tests/casper/*'];

gulp.task('unit-tests', function () {
  process.env['RM3_PG'] = 'postgresql://wirehead:rm3test@127.0.0.1/rm3unit';
  return gulp.src('tests/unit/*.js', {read: false})
        .pipe(mocha({}));
});

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

gulp.task('create-db', shell.task([
  'dropdb --if-exists rm3unit && createdb rm3unit'
]))

gulp.task('build-schema', ['create-db'], shell.task([
  'psql rm3unit < db-schema.sql'
]))

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

gulp.task('coverage-merge', shell.task([
  './node_modules/.bin/istanbul report lcov text'
]))

gulp.task('coveralls', shell.task([
  'cat ./coverage/lcov.info |  ./node_modules/codecov.io/bin/codecov.io.js'
]))

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

gulp.task('bower', function() {
  return bower()
    .pipe(gulp.dest('./bower_components'));
});

gulp.task('lint', ['jshint', 'jscs', 'csslint'])

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

gulp.task('casper-db', shell.task([
  'dropdb --if-exists rm3casper && createdb rm3casper'
]))

gulp.task('casper-schema', ['casper-db'], shell.task([
  'psql rm3casper < db-schema.sql'
]))

gulp.task('casper-fixtures', ['casper-db', 'casper-schema'], function() {
  return gulp.src('tests/page-fixtures/*.json', {read: false})
    .pipe(shell([
      './bin/rm3load -f <%= file.path %>'
    ], {env: {
      RM3_PG: 'postgresql://wirehead:rm3test@127.0.0.1/rm3casper'
    }}))
})

gulp.task('casper-users', ['casper-db', 'casper-schema', 'casper-fixtures'], function() {
  return gulp.src('')
    .pipe(shell([
      './bin/rm3admin adduser wirehead "Test User" -p "Some profile text" -u http://www.wirewd.com/ -e nobody@wirewd.com --password password',
      './bin/rm3admin assign wirehead root',
      './bin/rm3admin permit root edit \\*',
      './bin/rm3admin permit root delete \\*',
      './bin/rm3admin permit root view \\*',
      './bin/rm3admin permit root grant \\*',
      './bin/rm3admin permit root viewdraft \\*',
      './bin/rm3admin permit nobody view wh.!users.\\*',
    ], {env: {
      RM3_PG: 'postgresql://wirehead:rm3test@127.0.0.1/rm3casper'
    }}))
})

gulp.task('api-db', shell.task([
  'dropdb --if-exists rm3api && createdb rm3api'
]))

gulp.task('api-schema', ['api-db'], shell.task([
  'psql rm3api < db-schema.sql'
]))

gulp.task('api-fixtures', ['api-db', 'api-schema'], function() {
  return gulp.src('tests/page-fixtures/*.json', {read: false})
    .pipe(shell([
      './bin/rm3load -f <%= file.path %>'
    ], {env: {
      RM3_PG: 'postgresql://wirehead:rm3test@127.0.0.1/rm3api'
    }}))
})


gulp.task('api-users', ['api-db', 'api-schema', 'api-fixtures'], function() {
  return gulp.src('')
    .pipe(shell([
      './bin/rm3admin adduser wirehead "Test User" -p "Some profile text" -u http://www.wirewd.com/ -e nobody@wirewd.com --password password',
      './bin/rm3admin assign wirehead root',
      './bin/rm3admin permit root edit \\*',
      './bin/rm3admin permit root delete \\*',
      './bin/rm3admin permit root view \\*',
      './bin/rm3admin permit root grant \\*',
      './bin/rm3admin permit root viewdraft \\*',
      './bin/rm3admin permit nobody view wh.!users.\\*',
      './bin/rm3admin loadtemplate meta.json wh'
    ], {env: {
      RM3_PG: 'postgresql://wirehead:rm3test@127.0.0.1/rm3api'
    }}))
})

function spawnServerForTests(db, executable, params, timeout, setup, next) {
  var ctx = { cwd: process.cwd(),
    env: clone(process.env)
  }
  ctx.env.RM3_PG = db;
  ctx.env['RM3_JWT_SECRET'] = 'poniesandstuff';
  ctx.env['RM3_JWT_ISSUER'] = 'wirewd.com';
  var server = spawn(executable, params,
    ctx);
  setup(server);
  setTimeout(next.bind(this, server), timeout)  
}

function runCasperTests(tests, next) {
  var casperChild = spawn('./node_modules/.bin/mocha-casperjs', tests);

  casperChild.stdout.on('data', function (data) {
      gutil.log('CasperJS:', data.toString().slice(0, -1));
  });

  casperChild.on('close', function (code) {
    var success = code === 0; // Will be 1 in the event of failure
    if (success) {
      gutil.log('Casper tests passed');
    } else {
      gutil.log('Casper tests failed');
    }
    next(success);
  });
}


gulp.task('api-tests', ['api-users'], function(cb) {
  var tests = ['./tests/api/*'];

  spawnServerForTests('postgresql://wirehead:rm3test@127.0.0.1/rm3api',
    './bin/rm3front', [], 10000, function(server) {
      server.stderr.on('data', function (data) {
        gutil.log('ServerErr:', data.toString().slice(0, -1));;
      });
      server.stdout.on('data', function (data) {
        gutil.log('Server:', data.toString().slice(0, -1));
      });
    }, function(server) {
      process.env['RM3_PG'] = 'postgresql://wirehead:rm3test@127.0.0.1/rm3api';
      process.env['RM3_JWT_SECRET'] = 'poniesandstuff';
      process.env['RM3_JWT_ISSUER'] = 'wirewd.com';
      var error;
      return gulp.src('tests/api/*.js', {read: false})
            .pipe(mocha({})
              .on('end', function() {
                gutil.log('killing server');
                server.kill('SIGINT');
                cb(error);
              }))
              .on('error', function(err) {
                console.log(err);
                gutil.log('killing server');
                server.kill('SIGINT');
                error = err;
              })
    });
});

gulp.task('casper-tests', ['casper-users'], function(cb) {
  var tests = ['./tests/casper/*'];

  spawnServerForTests('postgresql://wirehead:rm3test@127.0.0.1/rm3casper',
    './bin/rm3front', [], 10000, function(server) {
      server.stderr.on('data', function (data) {
        gutil.log('ServerErr:', data.toString().slice(0, -1));;
      });
      server.stdout.on('data', function (data) {
        gutil.log('Server:', data.toString().slice(0, -1));
      });
    }, function(server) {
      runCasperTests(casperTests, function(success) {
        gutil.log('killing server');
        server.kill('SIGINT');
        if (success) {
          cb();
        } else {
          cb(new Error('fail'));
        }
      });
    });
});


gulp.task('casper-coverage', ['casper-users'], function (cb) {
  var serverlog = [];

  spawnServerForTests('postgresql://wirehead:rm3test@127.0.0.1/rm3casper',
    './node_modules/.bin/istanbul',
    ['cover', '--dir', './coverage/casper', '--handle-sigint', '--', 'bin/rm3front'],
    35000, function(server) {
      server.stderr.on('data', function (data) {
        serverlog.push(data);
      });
      server.stdout.on('data', function (data) {
        serverlog.push(data);
      });
    }, function(server) {
      runCasperTests(casperTests, function(success) {
        serverlog.forEach(function(element, index, array) {
          gutil.log('Server:', element.toString());
        });
        gutil.log('killing server');
        server.kill('SIGINT');
        if (success) {
          cb();
        } else {
          cb(new Error('fail'));
        }
      });
  });
});
