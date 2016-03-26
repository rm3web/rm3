# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]
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
- rm3backup generates a catalog file and dumps permissions

### Security
- RM3_SESSION_SECRET to store the session secret, instead of known hardcoded secret.

### Changed
- Gulpfile refactored into smaller chunks.
- gulp-clean-css replaces gulp-minify-css.

### Fixed
- Coverage collection fixed.

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

[Unreleased]: https://github.com/rm3web/rm3/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/rm3web/rm3/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/rm3web/rm3/compare/v0.1.0...v0.1.1