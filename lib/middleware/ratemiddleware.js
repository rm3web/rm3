var RateLimiter = require("rolling-rate-limiter");
var limiters = {};

exports = module.exports = function(sessionRedisClient) {
  limiters.userLogin = RateLimiter({
    redis: sessionRedisClient,
    namespace: "UserLoginLimiter",
    interval: 100000,
    maxInInterval: 10,
    minDifference: 100
  });
  limiters.csrfLimiter = RateLimiter({
    redis: sessionRedisClient,
    namespace: "CommentCsrfLimiter",
    interval: 10000,
    maxInInterval: 10,
    minDifference: 100
  });
  limiters.csrfEmailLimiter = RateLimiter({
    redis: sessionRedisClient,
    namespace: "EmailCsrfLimiter",
    interval: 100000,
    maxInInterval: 3,
    minDifference: 1000
  });
  limiters.emailLimiter = RateLimiter({
    redis: sessionRedisClient,
    namespace: "EmailLimiter",
    interval: 100000,
    maxInInterval: 3,
    minDifference: 1000
  });
  limiters.ipLimiter = RateLimiter({
    redis: sessionRedisClient,
    namespace: "CommentIpLimiter",
    interval: 100000,
    maxInInterval: 10,
    minDifference: 100
  });
  limiters.userLimiter = RateLimiter({
    redis: sessionRedisClient,
    namespace: "CommentUserLimiter",
    interval: 100000,
    maxInInterval: 10,
    minDifference: 100
  });
  return function addContext(req, res, next) {
    req.rateLimiter = {};
    req.rateLimiter.userLimiter = limiters.userLimiter;
    req.rateLimiter.ipLimiter = limiters.ipLimiter;
    req.rateLimiter.emailLimiter = limiters.emailLimiter;
    req.rateLimiter.csrfEmailLimiter = limiters.csrfEmailLimiter;
    req.rateLimiter.csrfLimiter = limiters.csrfLimiter;
    req.rateLimiter.userLogin = limiters.userLogin;
    next();
  };
};
