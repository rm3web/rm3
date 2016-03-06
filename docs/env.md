Environment variables for rm3
=============================

All dangerous environment variables, the sort of thing that you probably don't want to do unless you are going to be really careful about it, will contain the string `DANGER` as a warning.

RM3_PG
------

The Postgresql instance to connect to, in Postgres URL form (`postgresql://[user[:password]@][netloc][:port][/dbname][?param1=value1&...]`)

RM3_TWITTER_CONSUMER_KEY & RM3_TWITTER_CONSUMER_SECRET
------------------------------------------------------

**Warning: Do be careful with these keys.  Anyone with these keys can do anything that users have allowed you to do on Twitter.**

The consumer key and secret from Twitter, for login integration.

[You need to request an API key from Twitter](https://apps.twitter.com/) to obtain these values.

If these keys aren't present, Twitter auth won't be active.

RM3_JWT_SECRET & RM3_JWT_ISSUER
-------------------------------

**Warning: Do be careful with these keys.  Anyone with these keys can forge access credentials as any user on the system.**

RM3_JWT_SECRET contains either a secret key or a PEM-encoded public key for verifying a JSON Web Token secret.

RM3_JWT_ISSUER is the issuer that JWT tokens generated and verified are checked against.

If these keys aren't present, JWT won't be active.

RM3_SESSION_SECRET
------------------

**Warning: Do be careful with this secret.  Anyone with these keys can forge access credentials as any user's session on the system.**

This contains the session secret for rm3 that is used to encrypt the session ID that rm3 uses to track your logged in / not logged in state.

If you don't specify this key, Rm3 will generate a random string for you and use this as the session key.  This means that every time you restart rm3, it will loose all of the session cookies.

This should be fairly long and unguessable.

RM3_DANGER_FORCE_AUTH
---------------------

**Dangerous flag: If you have this running on the public web, someone will probably find it and hack you.**

This will force all connections to be authenticated as the user contained within this environment variable.

This is, obviously, a great way to get rooted.  It's also really handy for debugging and playing with things.