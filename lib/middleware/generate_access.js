exports = module.exports = function(userpath, username, db, query, entity) {
  return function generateAccess(req, res, next) {
    var security = {context: 'STANDARD'};
    if (req.hasOwnProperty('user') && req.user.hasOwnProperty('user')) {
      security.user = req.user.user.path();
    }
    req.access = security;
    next();
  };
};
