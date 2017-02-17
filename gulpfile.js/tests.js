var gulp = require('gulp')
  , shell = require('gulp-shell')
  , spawn = require('child_process').spawn
  , clone = require('clone')
  , gutil = require('gulp-util')
  , runSequence = require('run-sequence')
  , tcpPortUsed = require('tcp-port-used');

var casperTests = ['./tests/casper/*'];

gulp.task('test:unit', shell.task(['./node_modules/.bin/mocha --require ./tests/lib/mocha.js -c tests/unit/*.js'], {env: {
    RM3_PG: 'postgresql://wirehead:rm3test@127.0.0.1/rm3unit'
  }}));

gulp.task('test:db:db', shell.task([
  'dropdb --if-exists rm3unit && createdb rm3unit'
]))

gulp.task('test:db:schema', ['test:db:db'], shell.task([
  'psql rm3unit < db-schema.sql'
]))

gulp.task('test:db', ['test:db:db', 'test:db:schema'], 
  shell.task(['./node_modules/.bin/mocha --require ./tests/lib/mocha.js -c tests/db/*.js'], {env: {
    RM3_PG: 'postgresql://wirehead:rm3test@127.0.0.1/rm3unit'
  }}));

gulp.task('test:cli:db', shell.task([
  'dropdb --if-exists rm3cli && createdb rm3cli'
]))

gulp.task('test:cli:schema', ['test:cli:db'], shell.task([
  'psql rm3cli < db-schema.sql'
]))

gulp.task('test:cli', ['test:cli:db', 'test:cli:schema'], 
  shell.task(['./node_modules/.bin/mocha --require ./tests/lib/mocha.js -c tests/cli/*.js'], {env: {
    RM3_PG: 'postgresql://wirehead:rm3test@127.0.0.1/rm3cli'
  }}));

gulp.task('test:casper:db', shell.task([
  'redis-cli FLUSHALL',
  'dropdb --if-exists rm3casper && createdb rm3casper'
]))

gulp.task('test:casper:schema', ['test:casper:db'], shell.task([
  'psql rm3casper < db-schema.sql'
]))

gulp.task('test:casper:fixtures', ['test:casper:schema'], function() {
  return gulp.src('tests/page-fixtures/*.json', {read: false})
    .pipe(shell([
      './bin/rm3load -f <%= file.path %>'
    ], {env: {
      RM3_PG: 'postgresql://wirehead:rm3test@127.0.0.1/rm3casper'
    }}))
})

gulp.task('test:casper:users', ['test:casper:schema'], function() {
  return gulp.src('')
    .pipe(shell([
      './bin/rm3admin loadtemplate base_access.json wh',
    ], {env: {
      RM3_PG: 'postgresql://wirehead:rm3test@127.0.0.1/rm3casper'
    }}))
})

gulp.task('test:api:db', shell.task([
  'dropdb --if-exists rm3api && createdb rm3api'
]))

gulp.task('test:api:schema', ['test:api:db'], shell.task([
  'psql rm3api < db-schema.sql'
]))

gulp.task('test:api:fixtures', ['test:api:schema'], function() {
  return gulp.src('tests/page-fixtures/*.json', {read: false})
    .pipe(shell([
      './bin/rm3load -f <%= file.path %>'
    ], {env: {
      RM3_PG: 'postgresql://wirehead:rm3test@127.0.0.1/rm3api'
    }}))
})


gulp.task('test:api:users', ['test:api:schema'], function() {
  return gulp.src('')
    .pipe(shell([
      './bin/rm3admin loadtemplate base_access.json wh',
      './bin/rm3admin loadtemplate meta.json wh',
      './bin/rm3admin addclient abc123 ssh-secret Samplr'
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
  ctx.env['RM3_DANGER_DISABLE_HTTPS_CHECKS'] = true;
  var server = spawn(executable, params, ctx);
  setup(server);
  tcpPortUsed.waitUntilUsed(4000, 500, timeout)
  .then(function() {
    next(server);
  }, function(err) {
    gutil.log('Startup failed');
    next();
  });
}

function runTestChild(child, tests, next) {
  var ctx = { cwd: process.cwd(),
    env: clone(process.env)
  }
  ctx.env['RM3_JWT_SECRET'] = 'poniesandstuff';
  ctx.env['RM3_JWT_ISSUER'] = 'wirewd.com';
  var casperChild = spawn(child, tests, ctx);

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


gulp.task('test:api', ['test:api:db', 'test:api:schema', 'test:api:fixtures', 'test:api:users'], function(cb) {
  var tests = ['--require', './tests/lib/mocha.js', '-c', './tests/api/*'];

  spawnServerForTests('postgresql://wirehead:rm3test@127.0.0.1/rm3api',
    './bin/rm3front', [], 165000, function(server) {
      server.stderr.on('data', function (data) {
        gutil.log('ServerErr:', data.toString().slice(0, -1));;
      });
      server.stdout.on('data', function (data) {
        gutil.log('Server:', data.toString().slice(0, -1));
      });
    }, function(server) {
      runTestChild('./node_modules/.bin/mocha', tests, function(success) {
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

gulp.task('test:casper', ['test:casper:db', 'test:casper:users', 'test:casper:fixtures'], function(cb) {
  var tests = ['./tests/casper/*'];

  spawnServerForTests('postgresql://wirehead:rm3test@127.0.0.1/rm3casper',
    './bin/rm3front', [], 165000, function(server) {
      server.stderr.on('data', function (data) {
        gutil.log('ServerErr:', data.toString().slice(0, -1));;
      });
      server.stdout.on('data', function (data) {
        gutil.log('Server:', data.toString().slice(0, -1));
      });
    }, function(server) {
      runTestChild('./node_modules/.bin/mocha-casperjs', casperTests, function(success) {
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

gulp.task('coverage:report', shell.task(['./node_modules/.bin/nyc report -r html -r lcov -r html']));

gulp.task('test', ['test:unit', 'test:db']);

gulp.task('base-coverage:core', function(callback) {
  runSequence('test:unit',
              'test:db',
              callback);
});

gulp.task('coverage:core', function(callback) {
  runSequence('test:unit',
              'test:db',
              'test:casper',
              'test:api',
              callback);
});

gulp.task('base-coverage', shell.task(['./node_modules/.bin/nyc --cache ./node_modules/.bin/gulp base-coverage:core',
  './node_modules/.bin/nyc report -r html -r lcov -r html']));

gulp.task('coverage', shell.task(['./node_modules/.bin/nyc --cache ./node_modules/.bin/gulp coverage:core',
  './node_modules/.bin/nyc report -r html -r lcov -r html']));

