var RateLimiter = require("rolling-rate-limiter");

exports = module.exports = function(sessionRedisClient) {
  return function addContext(req, res, next) {
    req.rateLimiter = {};
    req.rateLimiter.userLogin = RateLimiter({
      redis: sessionRedisClient,
      namespace: "UserLoginLimiter",
      interval: 100000,
      maxInInterval: 10,
      minDifference: 100
    });
    req.rateLimiter.csrfLimiter = RateLimiter({
      redis: sessionRedisClient,
      namespace: "CommentCsrfLimiter",
      interval: 10000,
      maxInInterval: 10,
      minDifference: 100
    });
    req.rateLimiter.csrfEmailLimiter = RateLimiter({
      redis: sessionRedisClient,
      namespace: "EmailCsrfLimiter",
      interval: 100000,
      maxInInterval: 3,
      minDifference: 1000
    });
    req.rateLimiter.emailLimiter = RateLimiter({
      redis: sessionRedisClient,
      namespace: "EmailLimiter",
      interval: 100000,
      maxInInterval: 3,
      minDifference: 1000
    });
    req.rateLimiter.ipLimiter = RateLimiter({
      redis: sessionRedisClient,
      namespace: "CommentIpLimiter",
      interval: 100000,
      maxInInterval: 10,
      minDifference: 100
    });
    req.rateLimiter.userLimiter = RateLimiter({
      redis: sessionRedisClient,
      namespace: "CommentUserLimiter",
      interval: 100000,
      maxInInterval: 10,
      minDifference: 100
    });
    next();
  };
};
