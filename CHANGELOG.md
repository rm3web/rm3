# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## Release urgency levels:

* Low: Just new features and bugfixes.  Nothing that will change the database format.
* Moderate: There's some important new features.  You don't want to skip moderate releases, but there's nothing urgent.  Anything that changes the format of the database is by default a moderate change or higher.
* High: There's a critical bug that may impact a percentage of the users.  Upgrade!
* Critical: There's a critical bug that impacts most of the users.  Upgrade ASAP!

## [Unreleased]

### Fixed
- Default sort order on the blog index was wrong.

## [0.3.7] - Low - 2017-02-05: Superb, and not so superb, owl edition

### Added
- Blog index proto.
- Image index proto.
- Ontological tag index proto.

### Changed
- Unbranded the default header logo now that the innards are in a good enough shape, even lacking a public API, that I can insert the branding on my end.
- Updated dependencies:
  - cache-service-redis that has a contributed patch to let you connect to a differently numbered redis database which made running multiple rm3 instances on the same node tricky.
- Tweaked the style system slightly so it's easier to remove the navbar index via Dust.
- Can disable the basicindex pagination "more" link
- Page for the predicate proto now has a search and shows useful information.

### Fixed
- If you tried to load a page with an unsupported proto, the index code would crash.  Now it will vaguely work.

## [0.3.6] - Low - 2017-01-16: Women's March on Washington edition
### Added
- `rm3rm` command to delete an entity via the CLI.
- Proper icon for audio.
- Blog-with-sidebar proto.

### Changed
- PureCSS's npm package is in good shape these days; removing bower entirely.

### Fixed
- `rm3wf` didn't support the blobstore, which broke things.
- Weird formatting issue that crept in when creating a page with invalid HTML.

## [0.3.5] - Low - 2017-01-16: Martin Luther King Jr. edition
### Added
- `rm3wf` command to just run the workflow without responding to web requests.

### Changed
- Cache key for most recent changed is now based on the path root.
- Re-organized startup phases to make it easier to use debugging tools that catch errors and insert themselves into the express pipeline (sentry, rollbar, exceptional.io, et al)

## [0.3.4] - Low - 2017-01-08: California Rainpocalypse special edition
### Added
- You can now disable workflow processing entirely with the `RM3_WF_DISABLE` env variable.
- More tweaks to internal workflow tasks.
- Scheme can be a child of another scheme, where any changed files will override from the parent.  (Not really part of the public API yet)

### Changed
- Updated dependencies
- Refactored the protos such that there is now a simple decorator to expose blob files.

### Fixed
- loaddump will load blob-less protos requiring workflow properly.
- In the audio proto, the play button disabled until the MP3 has loaded.

## [0.3.3] - Low - 2017-01-01: New Years Day Sick-but-not-hungover edition

### Added
- Users can now add i10n strings. (very alpha API, not ready for extensions yet)
- Users can now add workflows. (very alpha API, not ready for extensions yet)
- Documented the siteconfig.
- Obey the root path from the siteconfig.
- Users are under the root path from the siteconfig.

### Changed
- More test coverage improvements

### Fixed
- Weird copypasta in the page bundle that might have messed up creation of some of the page-like entities.

## [0.3.2] - Low - 2016-12-27: Vera Rubin two-releases-in-a-day edition

### Changed
- Refactored how things are hooked up at startup so that the db and cache land in `app.locals`
- Refactored rate limiting code
- Migrated code away from `scheme/default/helper.js` and increased test coverage

### Fixed
- When you update a page as draft, redirect the user to the right URL.

## [0.3.1] - Low - 2016-12-27: George Michael + Carrie Fisher edition

### Added
- Justified and Masonry views.
- Caching SQL requests in redis for findBlob
- Added the initialization of schemes to a overridable phase of startup.

### Changed
- Updated dependencies
- All of the unit tests use Chai instead of Should.
- Tweaked grid formatting to make the grids line up.

### Fixed
- If the Revision ID wasn't found, throw up a 400 error instead of a 500.
- When you create a page as draft, redirect the user to the right URL.
- When you create a page as draft, then edit it as a draft, the workflow was getting messed up.

## [0.3.0] - Medium - 2016-9-24: Coming to you live and direct edition...

This version is the first I'm actually trying to run in production.

This version is incompatible with 0.1.x and 0.2.x databases.  The upgrade path from 0.2.x databases is to dump using rm3backup to a directory that you load with rm3load and recreate the permissions  (You can manually edit `permissions.json` if necessary).  You will also need to manually set hidden to false (use `update wh_entity set hidden=false;` in your SQL database)

### Added
- More operational docs, explained some of the authentication pipeline.
- Ability to change the number of items per page and select protos and child paths.
- BREAKING: Ability to have hidden pages.
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
- Inspects URLs passed by bookmarklet for OpenGraph and other information.
- Refactored permissions to have more fine-grained permissions.
- Made comments able to be held in a moderation state.
- Allowed the user to set the 'memo' field and not update the update time (For minor textual changes)
- Added a tree view page to browse all of the pages within a site.
- Added the ability to load a dump under a username.
- Added textblock to the photo / vectorgraphic / audio protos.
- Backed off the default workflow poll rate, allow it to be set with by the `RM3_WF_RUN_INTERVAL` environment variable.

### Changed
- BREAKING: Upgraded to textblocks-0.14, removed support for pragma blocks entirely.
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
- Added a parent query for pages that are 3 layers deep in the site.
- Tweaked icons to add more icon types and make them more centered.

### Fixed
- Search page doesn't cause errors when you don't pass it the right search.
- Some uninitialized variables in the forms.
- Increased the range of SVGs able to work by running svgo before domPurify.
- Twitter auth wasn't quite storing the right profile info.
- rm3load doesn't try to start a workflow worker, just the workflow system.
- API-driven commands were defaulting to the wrong path.

## [0.2.3] - Low - 2016-7-23: Importing it's grandparents edition

### Fixed
- "More" links weren't wrapping properly.
- Month/Year Facets are in the wrong order.
- Switched to private branch for `wf-pg-backend` because of build issues.

## [0.2.2] - Low - 2016-7-23: Special perfectly swell bugfix edition

### Changed
- Updated dependencies

### Fixed
- If you load a dump and it doesn't have credentials or permissions, it won't try to load.
- Query generation was generating oldest-first queries when it needed newest-first queries.

## [0.2.1] - Medium - 2016-7-23: With the skin still itchy edition

### Changed
- Updated dependencies

### Fixed
- Coverage collection fixed again.
- In the BaseBehavior mixin, the list of fields that can be inserted can be defined by the underlying proto.
- Creates a blob alias after a tag so that images don't break if you add a tag to them.

## [0.2.0] - High - 2016-7-17: Special Sunny July with Poison Ivy edition

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

## [0.1.2] - High - 2016-3-5: Special documentation on a Rainy Day edition
### Added
- rm3backup command
- Faceting based on tags
- More documentation

### Changed
- Updated dependencies

### Fixed
- Login form had some React-isms that were breaking the Dust version.

## [0.1.1] - Low - 2016-2-28
### Fixed
- Fails to operate correctly when there's no JWT token
- Removed login form in JSX and just went for straight Dust.
- Added generated Travis tarball to npmignore.

## rm3 0.1.0 - Medium - 2016-2-28: Special Pirates of Penzance Sing-Along edition
### Added
- First release.

## rm2

I started on Rm2 in early 2011, once I had a few too many aborted efforts into refactoring the questionable design decisions from 2004 and wanted some stuff to speed up my learning of how node.js worked.  There are several classes that exist solely as direct ports of the Ruby version of the object, but using JavaScript idioms instead.  Some of them got coppied over to rm3.

## rm

I started on Rm around October 2004.  It became functional at the start of 2005, but I went through various rewrites and distractions and didn't actually launch it until Oct 2007.  It's been running in production ever since.

Most of the basic concepts behind rm3 were born here.  Entities (I called them Nodes, but then decided it would be really confusing), Logs, a Query engine, Paths that map to PostgreSQL ltree types, RDF/JSON-LD styled triple-tags, and more.

Unfortunately, I didn't write any unit tests and kinda forgot all of the corner cases that I manually tested and decided I needed to start over.

[Unreleased]: https://github.com/rm3web/rm3/compare/v0.3.7...HEAD
[0.3.6]: https://github.com/rm3web/rm3/compare/v0.3.6...v0.3.7
[0.3.6]: https://github.com/rm3web/rm3/compare/v0.3.5...v0.3.6
[0.3.5]: https://github.com/rm3web/rm3/compare/v0.3.4...v0.3.5
[0.3.4]: https://github.com/rm3web/rm3/compare/v0.3.3...v0.3.4
[0.3.3]: https://github.com/rm3web/rm3/compare/v0.3.2...v0.3.3
[0.3.2]: https://github.com/rm3web/rm3/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/rm3web/rm3/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/rm3web/rm3/compare/v0.2.3...v0.3.0
[0.2.3]: https://github.com/rm3web/rm3/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/rm3web/rm3/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/rm3web/rm3/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/rm3web/rm3/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/rm3web/rm3/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/rm3web/rm3/compare/v0.1.0...v0.1.1