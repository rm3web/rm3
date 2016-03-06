var gulp = require('gulp')
  , shell = require('gulp-shell')
  , spawn = require('child_process').spawn
  , clone = require('clone')
  , gutil = require('gulp-util')

var casperTests = ['./tests/casper/*'];

gulp.task('coverage:clear', shell.task(['rm -rf .nyc_output']));

gulp.task('test:unit', shell.task(['./node_modules/.bin/mocha --require ./tests/lib/mocha.js -c tests/unit/*.js'], {env: {
    RM3_PG: 'postgresql://wirehead:rm3test@127.0.0.1/rm3unit'
  }}));

gulp.task('coverage:unit', shell.task(['./node_modules/.bin/nyc ./node_modules/.bin/mocha --require ./tests/lib/mocha.js -c tests/unit/*.js'], {env: {
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

gulp.task('coverage:db', ['test:db:db', 'test:db:schema'], 
  shell.task(['./node_modules/.bin/nyc ./node_modules/.bin/mocha --require ./tests/lib/mocha.js -c tests/db/*.js'], {env: {
    RM3_PG: 'postgresql://wirehead:rm3test@127.0.0.1/rm3unit'
  }}));

gulp.task('test:casper:db', shell.task([
  'dropdb --if-exists rm3casper && createdb rm3casper'
]))

gulp.task('test:casper:schema', ['test:casper:db'], shell.task([
  'psql rm3casper < db-schema.sql'
]))

gulp.task('test:casper:fixtures', ['test:casper:db', 'test:casper:schema'], function() {
  return gulp.src('tests/page-fixtures/*.json', {read: false})
    .pipe(shell([
      './bin/rm3load -f <%= file.path %>'
    ], {env: {
      RM3_PG: 'postgresql://wirehead:rm3test@127.0.0.1/rm3casper'
    }}))
})

gulp.task('test:casper:users', ['test:casper:db', 'test:casper:schema', 'test:casper:fixtures'], function() {
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

gulp.task('test:api:db', shell.task([
  'dropdb --if-exists rm3api && createdb rm3api'
]))

gulp.task('test:api:schema', ['test:api:db'], shell.task([
  'psql rm3api < db-schema.sql'
]))

gulp.task('test:api:fixtures', ['test:api:db', 'test:api:schema'], function() {
  return gulp.src('tests/page-fixtures/*.json', {read: false})
    .pipe(shell([
      './bin/rm3load -f <%= file.path %>'
    ], {env: {
      RM3_PG: 'postgresql://wirehead:rm3test@127.0.0.1/rm3api'
    }}))
})


gulp.task('test:api:users', ['test:api:schema', 'test:api:fixtures'], function() {
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
  var server = spawn(executable, params, ctx);
  setup(server);
  setTimeout(next.bind(this, server), timeout)  
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
    './bin/rm3front', [], 10000, function(server) {
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

gulp.task('coverage:api', ['test:api:db', 'test:api:schema', 'test:api:fixtures', 'test:api:users', 'test:api:users'], function(cb) {
  var tests = ['--require', './tests/lib/mocha.js', '-c', './tests/api/*'];

  spawnServerForTests('postgresql://wirehead:rm3test@127.0.0.1/rm3api',
    './node_modules/.bin/nyc', ['bin/rm3front'], 125000, function(server) {
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

gulp.task('test:casper', ['test:casper:db', 'test:casper:users'], function(cb) {
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


gulp.task('coverage:casper', ['test:casper:db', 'test:casper:users'], function (cb) {
  var serverlog = [];

  spawnServerForTests('postgresql://wirehead:rm3test@127.0.0.1/rm3casper',
    './node_modules/.bin/nyc', ['bin/rm3front'], 125000, function(server) {
      server.stderr.on('data', function (data) {
        serverlog.push(data);
      });
      server.stdout.on('data', function (data) {
        serverlog.push(data);
      });
    }, function(server) {
      runTestChild('./node_modules/.bin/mocha-casperjs', casperTests, function(success) {
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


gulp.task('test', ['test:unit', 'test:db']);

//Bit of a hack to reduce concurrency
gulp.task('coverage:base', ['test:db:db', 'coverage:clear', 'coverage:unit', 'coverage:db'])
gulp.task('coverage:extra', ['test:db:db', 'test:casper:db', 'coverage:base', 'coverage:casper'])

gulp.task('base-coverage', ['coverage:clear', 'coverage:base'],
  shell.task(['./node_modules/.bin/nyc report -r html -r lcov -r html',]));

gulp.task('coverage', ['coverage:clear', 'coverage:base', 'coverage:extra', 'coverage:casper', 'coverage:api'],
  shell.task(['./node_modules/.bin/nyc report -r text -r lcov -r html']));