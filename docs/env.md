Environment variables for rm3
=============================

All dangerous environment variables, the sort of thing that you probably don't want to do unless you are going to be really careful about it, will contain the string `DANGER` as a warning.

RM3_LISTEN_PORT
---------------

The port that rm3 should listen at.

RM3_LISTEN_HOST
---------------

The address that rm3 is listening at.  By default, it's only listening only on the loopback address (e.g. 127.0.0.1)

If you change this to `0.0.0.0`, rm3 will be accessible on the public internet.  This may not be what you want; rm3 is mostly designed to work with a reverse proxy such as nginx or apache running in front of it.

You can use this to bind to a particular interface, if you are setting up a separate network to run just load balancers on.

RM3_PG
------

The Postgresql instance to connect to, in Postgres URL form (`postgresql://[user[:password]@][netloc][:port][/dbname][?param1=value1&...]`)

RM3_SESSION_REDIS
-----------------

The Redis instance to store session data in, in Redis URL form (`redis://netloc:port/dbnumber`).

You want to have one redis instance for session data, shared between all rm3 processes.  For small configurations, you can share it with the cache redis.

RM3_CACHE_REDIS
-----------------

The Redis instance to store cache data in, in Redis URL form (`redis://netloc:port/dbnumber`).

You can have multiple different local instances of the cache redis, there's nothing that's not a cache of the database stored here.  For small configurations, you can share it with the session redis.

RM3_LOCAL_BLOBS
---------------

The directory (can be relative or absolute) where rm3 is to store it's blobs (e.g. binary files like photos)

RM3_RESOURCES
-------------

The directory (can be relative or absolute) where rm3 is to find it's static resources (e.g. the scheme).  The default should work.

RM3_EMAIL
---------

The email server to relay mail through (e.g. `smtps://127.0.0.1`)

RM3_DANGER_TRUST_PROXY
----------------------

**Warning: Do be careful with this setting.  If anyone can connect to your http endpoint and insert environment variables, they can bypass https checks and masacarde as other IP addresses.**

See [Express documentation for running behind a proxy](http://expressjs.com/en/guide/behind-proxies.html) to see how to set this.  If you are running nginx or varnish or apache on the same node, you probably want to set this to `loopback`.  Otherwise, some combination of `'loopback`, `linklocal`, or `uniquelocal` might be better.

RM3_TWITTER_CONSUMER_KEY & RM3_TWITTER_CONSUMER_SECRET
------------------------------------------------------

**Warning: Do be careful with these keys.  Anyone with these keys can do anything that users have allowed you to do on Twitter.**

The consumer key and secret from Twitter, for login integration.

[You need to request an API key from Twitter](https://apps.twitter.com/) to obtain these values.

If these keys aren't present, Twitter auth won't be active.

RM3_JWT_SECRET, RM3_JWT_ISSUER, RM3_JWT_EXPIRES_SECONDS, & RM3_JWT_AUDIENCE_ROOT
--------------------------------------------------------------------------------

**Warning: Do be careful with these keys.  Anyone with these keys can forge access credentials as any user on the system.**

OAuth 2 / OpenID Connect are built atop the JWT layer and make use of the JWT credentials.

RM3_JWT_SECRET contains either a secret key or a PEM-encoded public key for verifying a JSON Web Token secret.

RM3_JWT_ISSUER is the issuer that JWT tokens generated and verified are checked against.

RM3_JWT_AUDIENCE_ROOT is the root for audience paths.  Both RM3_JWT_ISSUER and RM3_JWT_AUDIENCE_ROOT are probably the root path for your site.

If RM3_JWT_SECRET and RM3_JWT_ISSUER are not present, JWT and OAuth2/OpenID Connect won't be active.

RM3_JWT_EXPIRES_SECONDS is specified by the number of seconds before JWT tokens and thus OAuth 2 / OpenID Connect tokens expire.  It defaults to 24 hours.

RM3_TOTP_ISSUER
---------------

The 'issuer' for [Google Authenticatior](https://github.com/google/google-authenticator/wiki/Key-Uri-Format) and other TOTP authentication systems.

If this key isn't active, the Issuer will be `AnonymousRm3`.  This is only there to disambiguate multiple logins for different users (e.g. if they are 'wirehead' on multiple services, this lets them know which token to use)

RM3_SESSION_SECRET
------------------

**Warning: Do be careful with this secret.  Anyone with these keys can forge access credentials as any user's session on the system.**

This contains the session secret for rm3 that is used to encrypt the session ID that rm3 uses to track your logged in / not logged in state.

If you don't specify this key, Rm3 will generate a random string for you and use this as the session key.  This means that every time you restart rm3, it will loose all of the session cookies.

This should be fairly long and unguessable.

RM3_CACHE_CONTROL_DISABLE
-------------------------

If this env variable is set, rm3 won't try to generate ETags or Cache-Control headers, which means that all of the intervening caches won't work.  This is only really useful if you are trying to develop the front-end.

RM3_DANGER_DISABLE_HTTPS_CHECKS
-------------------------------

**Dangerous flag: If you have this running on the public web, passwords are getting passed in cleartext.**

Disables the HTTPS checks for sensitive operations.  This means you can log in over HTTP instead of HTTPS.

This is, obviously, a great way to get rooted if you tend to use coffeeshop or other public networks.  It's also really handy for debugging and playing with things.

RM3_WF_RUN_INTERVAL
-------------------

Controls the 'poll rate' for the workflow system.  Set to poll every 5 seconds which doesn't consume overly large amounts of CPU.  You can back this off further (but then uploads of images will take longer to post on the site) for even less CPU usage.

RM3_WF_DISABLE
--------------

Disables the workflow system entirely.  By default, the workflow engine runs in the background for all rm3 processes.  That's probably too much if you have a large site with a bunch of rm3 processes, so you can only have it running on a subset of the rm3 processes.