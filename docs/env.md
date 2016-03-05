Environment variables for rm3
=============================

All dangerous environment variables, the sort of thing that you probably don't want to do unless you are going to be really careful about it, will contain the string `DANGER` as a warning.

RM3_PG
------

The Postgresql instance to connect to, in Postgres URL form (`postgresql://[user[:password]@][netloc][:port][/dbname][?param1=value1&...]`)

RM3_TWITTER_CONSUMER_KEY & RM3_TWITTER_CONSUMER_SECRET
------------------------------------------------------

The consumer key and secret from Twitter, for login integration

RM3_JWT_SECRET & RM3_JWT_ISSUER
-------------------------------

RM3_JWT_SECRET contains either a secret key or a PEM-encoded public key for verifying a JSON Web Token secret.

RM3_JWT_ISSUER is the issuer that JWT tokens generated and verified are checked against.

RM3_DANGER_FORCE_AUTH
---------------------

**Dangerous flag**

This will force all connections to be authenticated as the user contained within this environment variable.

This is, obviously, a great way to get rooted.  It's also really handy for debugging and playing with things.