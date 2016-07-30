How authentication works in rm3
===============================

Sessions and Session IDs
------------------------

[Session ID's](https://www.owasp.org/index.php/Session_Management_Cheat_Sheet) are a way to persist session data, including authentication information, across a series of discrete stateless HTTP/HTTPS requests.

Thus, if you break the Session mechanism for a system, you can bypass the most secure of Authentication mechanisms.

Pretty much, I'm going for 'un-glamorous' and 'normal', betting that it's better to get patched at the same time as everybody else.  There's some potential improvements, but in order to make them, I'd have to write some custom security code and I'm really not a security expert so I don't trust what happens if I were to try to write security code.  So, I'm using `express-session` for session management.

So, a user hits the page.  The way it's configured by default, any new user without an existing session has one created.

The session is broken into two halves.  The first half is a Session ID, which is a sufficently un-guessable ID string.  The second half is the actual Session object, which is just a JavaScript Object.  The SessionID lives in the user's browser cookie store, the Session lives in Redis.  Oh, and the SessionID's key is generated using the `uid-safe` library, which just calls `crypto.randomBytes` with a few wrappers bits for for safety and concurrency and serializes it as Base64 string.

The SessionID is a 24 bytes long.

Now, if we were just sending a long Session ID in the cookie... well, there are a few attacks that you can make on a session mechanism that way.

Instead, the Session ID is signed using the Cookie-Signature.  Cookie-signature creates an [HMAC](https://en.wikipedia.org/wiki/Hash-based_message_authentication_code) using SHA-256 with a publicly-visible Session ID and a secret key set in an environment variable.

This way, express-session can do a fairly fast operation with the secret and validate the Session ID against the stored secret and then, if the HMAC-SHA-256 of the SessionID passes against the secret, it will then look up the session record in the database (In our case, Redis).

There are a few attacks to be aware of.  A 24 byte string has 2^192 possible values.  That's a lot of possibilities.  However, if you've got a lot of active users with a lot of sessions, eventually the pigeonhole principle makes it fairly likely that you'll hit SOMETHING at a fast enough brute-force rate.  Having a 256 bit key basically means that you have to guess 2^256 potential keys with the same single possible value, so that blows out your complexity... but only as long as the session secret remains secure.  If the Session ID generator isn't actually a random number, that makes the guessing even easier.

There's some risk of the HMAC-SHA-256 turning out to be flawed, although so far it's still 'good enough'.  A potentially more 'optimal' approach would be to use Poly1305-AES or Poly1305-ChaCha20.  Except you can't just do a search-and-replace on the algorythms, you really need to cycle through 'nonce' values so that each time you generate a new signed session ID, it looks different.

Authentication
--------------

* TODO *