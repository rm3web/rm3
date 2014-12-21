var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    user = require('../user');

exports.passport_connect = function passport_connect(db, query, entity, userpath) {
  // Passport session setup.
  //   To support persistent login sessions, Passport needs to be able to
  //   serialize users into and deserialize users out of the session.  Typically,
  //   this will be as simple as storing the user ID when serializing, and finding
  //   the user by ID when deserializing.
  passport.serializeUser(function(user, done) {
    var userstr = user.path().leaf() + ':' +user._entity_id;
    done(null, userstr);
  });

  passport.deserializeUser(function(id, done) {
    var userids = id.split(':',2);
    user.findByUsername(db, query, entity, userpath, userids[0], function (err, user) {
      if (user._entity_id === userids[1]) {
        done(err, user);
      } else {
        done(new Error('bad id'));
      }
    });
  });

  // Use the LocalStrategy within Passport.
  //   Strategies in passport require a `verify` function, which accept
  //   credentials (in this case, a username and password), and invoke a callback
  //   with a user object.  In the real world, this would query a database;
  //   however, in this example we are using a baked-in set of users.
  passport.use(new LocalStrategy(
    function(username, password, done) {
      // Find the user by username.  If there is no user with the given
      // username, or the password is not correct, set the user to `false` to
      // indicate failure and set a flash message.  Otherwise, return the
      // authenticated `user`.
      user.findByUsername(db, query, entity, userpath, username, function(err, userRec) {
        if (err) { return done(err); }
        user.authenticatePassword(password, userRec, function(err) {
          if (err) {
            return done(err);
          } else {
            return done(null, userRec);
          }
        });
      });
    }
  ));
};

exports.passport = function(app) {
  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  app.use(passport.initialize());
  app.use(passport.session());
};

exports.passport_paths = function(app) {
  app.get('/\\$login/', function(req, res){
    req.scheme.render('login', {meta: {modified: null, created:null}, user: req.user, message: req.flash('error')},
      function(err, page) {
        if (err) {
          res.write("ERROR");
          console.log(err);
          res.end();
          return;
        }
        res.writeHead(200, {'Content-Type': 'text/html'});
        page.on("data", function(data) {
          res.write(data);
        })
        .on("end", function() {
          res.end();  
        })
        .on("error", function(err) {
          res.end();
          console.log("RENDERNG ERROR");
          console.log(err);       
        });
      });
  });

  app.post('/\\$login/', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
      if (err) { return next(err); }
      if (!user) {
        req.flash('error', info.message);
        return res.redirect('/$login');
      }
      req.logIn(user, function(err) {
        if (err) { return next(err); }
        //return res.redirect('/users/' + user.username);
        return res.redirect('/');
      });
    })(req, res, next);
  });

  app.get('/\\$logout/', function(req, res){
    req.logout();
    res.redirect('/');
  });
};