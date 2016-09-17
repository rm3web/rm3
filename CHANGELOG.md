# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]

This version is incompatible with 0.1.x and 0.2.x databases.  The upgrade path from 0.2.x databases is to dump using rm3backup to a directory that you load with rm3load and recreate the permissions  (You can manually edit `permissions.json` if necessary)

### Added
- More operational docs, explained some of the authentication pipeline.
- Ability to change the number of items per page and select protos and child paths.
- Ability to have hidden pages.
- Card view now has tags.
- State machine to control drafts / approvals / blob workflow.
- Checkbox when you edit a page to control if you want to edit the draft further or create a new draft.
- Index uses thumbnails for photos and vector graphics.
- Atom feeds are now available
- Adding ETags to responses for HTTP caching.
- Can configure the listening port with `RM3_LISTEN_PORT`
- Added `RM3_CACHE_CONTROL_DISABLE` to make things easier for dev work.
- Added the ability to configure sites and disable the login button.
- Tracking 'touched' time separately from the official 'modified' time.
- Full text search.
- Rate limit (tracked via Redis) to prevent brute-force on logins and comments.
- Can disable the search on the sidebar for child pages.
- Caching SQL requests in redis:
  - fetchMostRecentChange
  - fetchEffectivePermissions
- Caching the SQL query generation to cache the slow squel part (424 ops/s vs. 102 ops/s)
- Removing some unnecessary copypasta so that most common CRUD operations need one less file.
- Setting `X-Frame-Options` and `X-Content-Type-Options` and disabling the `X-Powered-By` header.
- Checking for HTTPS when trying to log in (can be disabled with `RM3_DANGER_DISABLE_HTTPS_CHECKS`)
- Adding `RM3_DANGER_TRUST_PROXY` for use behind an nginx or apache or varnish or other such proxy.
- Added by default the `history` permission that controls if the user can see the history.
- Added image enrichment, to replace `img` tags with responsive images.
- Added `RM3_LISTEN_HOST` so you can only listen on the localhost.
- Added OpenGraph and Twitter Cards support.
- Added protos:
  - Link
  - Email form
  - Audio
- Added the ability to load history with rm3load
  - added --nohistory flag to smash history
  - breaks on 0.2.0 backups currently because it tries to assign a user to a permission once when it loads user history and once when it loads the credentials file.
- Inspects URLs passed by bookmarklet for OpenGraph and other information.
- Refactored permissions to have more fine-grained permissions.
- Made comments able to be held in a moderation state.
- Allowed the user to set the 'memo' field and not update the update time (For minor textual changes)
- Added a tree view page to browse all of the pages within a site.
- Added the ability to load a dump under a username.
- Added textblock to the photo / vectorgraphic / audio protos.
- Backed off the default workflow poll rate, allow it to be set with by the `RM3_WF_RUN_INTERVAL` environment variable.

### Changed
- Upgraded to textblocks-0.14, removed support for pragma blocks entirely.
- Changed setting so that a session cookie isn't generated until needed.
- Removed `connect-flash` and replaced it with tiny middlware, because sessions were being generated when they shouldn't.
- Security router is split out from command router, now if you don't supply a security router, the page is default-deny.
- The index class isn't very temporary.
- Removed default require for babel, now only running babel when importing JSX.
- Cleaned up the setup for the view JSON and removed repeated ugly code.
- Security: Reduced a bunch of routes that weren't really routable after all.
- Security: Session cookies are now httpOnly.
- Refactored protos for less repeated code.
- Improved error display.  403, 404, 410, 429 pages all have rendered templates, disable stackdumps in production
- Abstracts are now HTML text and are sanitized before being inserted into the system.
- Improved formatting on comment permalink view.

### Fixed
- Search page doesn't cause errors when you don't pass it the right search.
- Some uninitialized variables in the forms.
- Increased the range of SVGs able to work by running svgo before domPurify.
- Twitter auth wasn't quite storing the right profile info.
- rm3load doesn't try to start a workflow worker, just the workflow system.
- API-driven commands were defaulting to the wrong path.

## [0.2.3] - 2016-7-23: Importing it's grandparents edition

### Fixed
- "More" links weren't wrapping properly.
- Month/Year Facets are in the wrong order.
- Switched to private branch for `wf-pg-backend` because of build issues.

## [0.2.2] - 2016-7-23: Special perfectly swell bugfix edition

### Changed
- Updated dependencies

### Fixed
- If you load a dump and it doesn't have credentials or permissions, it won't try to load.
- Query generation was generating oldest-first queries when it needed newest-first queries.

## [0.2.1] - 2016-7-23: With the skin still itchy edition

### Changed
- Updated dependencies

### Fixed
- Coverage collection fixed again.
- In the BaseBehavior mixin, the list of fields that can be inserted can be defined by the underlying proto.
- Creates a blob alias after a tag so that images don't break if you add a tag to them.

## [0.2.0] - 2016-7-17: Special Sunny July with Poison Ivy edition

This version is incompatable with 0.1.x databases.

### Added
- Updated environment variable manual.
- Changed security warnings in the logs.
- Tombstones for deleted entities.
- Persistant storage of sessions in Redis
- Unit tests for the CLI tooling
- Templates can now create all of the RBAC entities and users.
- Blob store for binary objects (photos, audio, videos, etc).
- SVG support via Vector Graphics proto.
- JPEG support via Photograph proto.
- Workflow engine
- rm3backup generates a catalog file and dumps permissions, credentials, and blobs
- rm3load can load a backup folder generated by rm3backup in one step
- rm3admin can peek into identities
- Improved logging.
- Predicates can have a URI (For eventual JSON-LD / RDF goodness)
- Templates can now have an 'index' type

### Changed
- BREAKING: updated to textblocks 0.0.10, which is incompatible with previous versions.
- Gulpfile refactored into smaller chunks.
- gulp-clean-css replaces gulp-minify-css.
- User proto refactored
- Password paths shuffled
- Improved default page text to be a bit more beginner-friendly.
- Default behaviour after editing a page is to redirect back to the page, instead of showing edit again.

### Removed
- node 0.12 support removed.
- postgres 9.3 support removed.  postgres 9.4 now recommended.

### Fixed
- Coverage collection fixed.
- Icon generation uses picture polyfill instead of accidentally invalid html.
- If a user provides an invalid cookie for user deserialization (e.g. trying to log in after clearing the databse but not the Redis session cache) the error is logged and the request continues as if the user is unauthenticated.

### Security
- RM3_SESSION_SECRET to store the session secret, instead of known hardcoded secret.
- A bunch of views weren't checking for read access.
- Password changing has been protected differently from editing a user profile.
- Passwords are stored as credentials, instead of in the user object.
- TOTP Two-Factor authentication.
- CVE-2015-8851: node-uuid prior to 1.4.4 uses insecure random number generator.
- CVE-2016-5118: sharp prior to 0.15.0 uses insecure Magick.
- CWE-400: negotiator prior to 0.6.1 are vulnerable to ReDoS.

## [0.1.2] - 2016-3-5: Special documentation on a Rainy Day edition
### Added
- rm3backup command
- Faceting based on tags
- More documentation

### Changed
- Updated dependencies

### Fixed
- Login form had some React-isms that were breaking the Dust version.

## [0.1.1] - 2016-2-28
### Fixed
- Fails to operate correctly when there's no JWT token
- Removed login form in JSX and just went for straight Dust.
- Added generated Travis tarball to npmignore.

## rm3 0.1.0 - 2016-2-28: Special Pirates of Penzance Sing-Along edition
### Added
- First release.

## rm2

I started on Rm2 in early 2011, once I had a few too many aborted efforts into refactoring the questionable design decisions from 2004 and wanted some stuff to speed up my learning of how node.js worked.  There are several classes that exist solely as direct ports of the Ruby version of the object, but using JavaScript idioms instead.  Some of them got coppied over to rm3.

## rm

I started on Rm around October 2004.  It became functional at the start of 2005, but I went through various rewrites and distractions and didn't actually launch it until Oct 2007.  It's been running in production ever since.

Most of the basic concepts behind rm3 were born here.  Entities (I called them Nodes, but then decided it would be really confusing), Logs, a Query engine, Paths that map to PostgreSQL ltree types, RDF/JSON-LD styled triple-tags, and more.

Unfortunately, I didn't write any unit tests and kinda forgot all of the corner cases that I manually tested and decided I needed to start over.

[Unreleased]: https://github.com/rm3web/rm3/compare/v0.2.3...HEAD
[0.2.3]: https://github.com/rm3web/rm3/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/rm3web/rm3/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/rm3web/rm3/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/rm3web/rm3/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/rm3web/rm3/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/rm3web/rm3/compare/v0.1.0...v0.1.1