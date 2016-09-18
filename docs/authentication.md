How authentication works in rm3
===============================

Sessions and Session IDs
------------------------

[Session ID's](https://www.owasp.org/index.php/Session_Management_Cheat_Sheet) are a way to persist session data, including authentication information, across a series of discrete stateless HTTP/HTTPS requests.

Thus, if you break the Session mechanism for a system, you can bypass the most secure of Authentication mechanisms.

Pretty much, I'm going for 'un-glamorous' and 'normal', betting that it's better to get patched at the same time as everybody else.  There's some potential improvements, but in order to make them, I'd have to write some custom security code and I'm really not a security expert so I don't trust what happens if I were to try to write security code.  So, I'm using `express-session` for session management.

The session is lazy-created.  Until you are logging in to the site or otherwise triggering a more complex sort of event, it won't try to create a session for you.  This makes it easier for the cache to operate.

The session is broken into two halves.  The first half is a Session ID, which is a sufficently un-guessable ID string.  The second half is the actual Session object, which is just a JavaScript Object.  The SessionID lives in the user's browser cookie store (the `connect.sid` cookie) and the Session object lives in Redis.  Oh, and the SessionID's key is generated using the `uid-safe` library, which just calls `crypto.randomBytes` with a few wrappers bits for for safety and concurrency and serializes it as Base64 string.

The SessionID is a 24 bytes long string.

Now, if we were just sending a long Session ID in the cookie... well, there are a few attacks that you can make on a session mechanism that way.  You might just throw up a whole bunch of random session IDs, which is going to eat up the capacity on the session store.

Instead, the Session ID is signed using the Cookie-Signature.  Cookie-signature creates an [HMAC](https://en.wikipedia.org/wiki/Hash-based_message_authentication_code) using SHA-256 with a publicly-visible Session ID and a secret key set in an environment variable.

This way, express-session can do a fairly fast operation with the secret and validate the Session ID against the stored secret and then, if the HMAC-SHA-256 of the SessionID passes against the secret, it will then look up the session record in the database (In our case, Redis).

There are a few attacks to be aware of.  A 24 byte string has 2^192 possible values.  That's a lot of possibilities.  However, if you've got a lot of active users with a lot of sessions, eventually the pigeonhole principle makes it fairly likely that you'll hit SOMETHING at a fast enough brute-force rate.  Having a 256 bit key basically means that you have to guess 2^256 potential keys with the same single possible value, so that blows out your complexity... but only as long as the session secret remains secure.  If the Session ID generator isn't actually a random number, that makes the guessing even easier.

There's some risk of the HMAC-SHA-256 turning out to be flawed, although so far it's still 'good enough'.  A potentially more 'optimal' approach would be to use Poly1305-AES or Poly1305-ChaCha20, but you probably don't want to use a search-and-replace for the code, you probably want to write a new library that exposes a similar API but properly manages nonces and stuff.

Authentication
--------------

Next layer out is the actual authentication layer.

Again, 'un-glamorous' and 'normal'.  `passport` manages the different providers of authentication.  This way, you can just plug in Facebook or Twitter or any other desired system for authentication.

Authentication is protected by rate limits.

There's always a default local access system that stores a password locally.  Because it's really easy to screw that up, I'm using the `credential` library to do the actual password checking.

Credential uses PBKDF2 as a 'Key derivation' or 'Key stretching' function, with some extra logic to expand the key over time.  PBKDF2 is a one-way function.  It's designed such that it's easier to attack the stored stretched password with brute force than it is to work PBKDF2 backwards, and then the paramaters for PBKDF2 are set high enough that it's computationally expensive to brute force it.  This protects against an attack reading your password table and figuring out passwords as well as providing a rough limit on how fast you can brute force passwords.

There's a good chance that PBKDF2 is going to run out of ability to protect credentials.  The research in this area is still a bit lacking.  There was a password hashing competition but the winner and top contenders haven't been solidly cryptoanalyzed yet.

The user that you authenticate as is stored as a page within the site, but the credentials associated with your user are stored separately in the credentials table.

Other credentials, such as TOTP two-factor auth and more complex accounts from other servers with Passport login buttons, are also stored in the credentials table.