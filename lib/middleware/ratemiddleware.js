var RateLimiter = require("rolling-rate-limiter");
var logging = require('../logging');
var util = require("util");
var i10n = require('../i10n');
var errs = require('errs');

var limiters = {};
var boundLogger = logging.getRootLogger('middleware.ratemiddleware');

function RateLimitedError() {
  this.httpResponseCode = 429;
  this.message = "RATE_LIMITED";
  Error.call(this);
}
util.inherits(RateLimitedError, Error);
i10n.intlErrorMixin(RateLimitedError);
errs.register('middleware.ratemiddleware.limited', RateLimitedError);

var limiterFunction = function(limiter, key, req, res, next) {
  limiters[limiter](key, function(err, timeLeft) {
    if (err) {
      return next(err);
    } else if (timeLeft) {
      return logging.logAndCreateError(boundLogger, 'rate limited',
        'middleware.ratemiddleware.limited', {
          ctx: req.ctx,
          timeLeft: -timeLeft,
          reason: "Rate Limited"
        }, next);
    } else {
      return next();
    }
  });
};

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

    req.rateLimiter.userLogin = limiterFunction.bind(this,'userLogin');

    next();
  };
};
