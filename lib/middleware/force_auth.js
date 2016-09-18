var user = require('../authentication/user');

exports = module.exports = function(userpath, username, db, query, entity) {
  return function schemeMap(req, res, next) {
    user.findByUsername(db, {}, query, entity, userpath, username, function(err, user) {
      if (err) {
        console.log(err);
      }
      req.user = {user: user};
      next();
    });
  };
};
