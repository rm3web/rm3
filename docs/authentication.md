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

### Local passwords

There's always a default local access system that stores a password locally.  Because it's really easy to screw that up, I'm using the `credential` library to do the actual password checking.

Credential uses PBKDF2 as a 'Key derivation' or 'Key stretching' function, with some extra logic to expand the key over time.  PBKDF2 is a one-way function.  It's designed such that it's easier to attack the stored stretched password with brute force than it is to work PBKDF2 backwards, and then the paramaters for PBKDF2 are set high enough that it's computationally expensive to brute force it.  This protects against an attack reading your password table and figuring out passwords as well as providing a rough limit on how fast you can brute force passwords.

There's a good chance that PBKDF2 is going to run out of ability to protect credentials.  The research in this area is still a bit lacking.  There was a password hashing competition but the winner and top contenders haven't been solidly cryptoanalyzed yet.

The user that you authenticate as is stored as a page within the site, but the credentials associated with your user are stored separately in the credentials table.

Other credentials, such as TOTP two-factor auth and more complex accounts from other servers with Passport login buttons, are also stored in the credentials table.

### OAuth + OpenID Connect + etc.

OAuth 1 and 2 are, to be very specific, Authorization protocols, not Authentication protocols.  The difference is that an Authentication protocol is designed to say that somebody is who they say they are, whereas an Authorization protocol is designed to represent what they are allowed to do.

You can abuse... err... take advantage of their functionality to make an Authentication protocol out of them.  Which is what OpenID Connect provides a standardized version of.  Pretty much, you end up having the user authorize themselves on a separate site and then, in a three-handed handshake, the site receives a shared secret that allows them to execute a set of operations on behalf of the user.  As I prevously described, these are stored in the same credentials table as everything else, but because it's a shared secret, you can't use PBKDF2 as a one-way key stretching function.

Rm3 will store a subset of the credential information that Passport provides, scrubbing anything too transient or too sensitive.

JWT and OAuth2 / OpenID access tokens
-------------------------------------

For browser applications, storing a Session ID is a great way to handle repeated authentication of a user, such that they log in once and nothing so sensitive as a password is stored in the user's browser.

On the other hand, non-interactive applications don't work like that.

Enter JWT, which provides a fairly standardized way to encode a JSON payload containing claims that are protected with an encrypted hash.

An access token can handle authentication or authorization.  Right now, the access tokens just handle authentication.

This is disabled, by default, but you can enable it by setting the RM3_JWT_SECRET, RM3_JWT_ISSUER, and RM3_JWT_AUDIENCE_ROOT variables.  **Be careful with JWT keys.  If you have the JWT keys, you can forge all kinds of credentials.  If you don't have a need for this feature, leave it in the default turned-off state.**

The relevant claims for a JWT key are:

* `aud`(Audience): `RM3_JWT_AUDIENCE_ROOT` + '/accessToken'
* `sub`(Subject): `clientID` + '/' + `userName` + `userEntityId`
* `iss`(Issuer): `RM3_JWT_ISSUER`

You need to set a clientID with the rm3admin command.