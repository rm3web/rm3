rm3
===

A platform for publishing more than just textual articles on the web.
---------------------------------------------------------------------

[![Build Status](https://travis-ci.org/rm3web/rm3.svg?branch=master)](https://travis-ci.org/rm3web/rm3) [![codecov.io](http://codecov.io/github/rm3web/rm3/coverage.svg?branch=master)](http://codecov.io/github/rm3web/rm3?branch=master) [![Dependency Status](https://david-dm.org/rm3web/rm3.svg)](https://david-dm.org/rm3web/rm3) [![npm version](https://badge.fury.io/js/rm3.svg)](https://badge.fury.io/js/rm3)

What is it?
-----------

rm3 is not just a blog engine, but it's still lighter-weight and friendlier than those enterprise-grade CMS systems.  Conceptually, it is to Drupal as Ghost is to WordPress.

rm3 is able work as a blog, a wiki, a photo archive, or some combination of those... and more.

rm3 has blog-styled views such that you can post a series of dated blog articles and view them as such.  But every entity on the site has a history, like how a wiki works.  Like some of those enterprise CMS systems, you aren't restricted to just creating a mere list of posts.

rm3 has rapidly improving support for media:  It supports photos, but it also supports SVG vector graphics and audio files.  

Release Status
--------------

See [CHANGELOG.md](CHANGELOG.md) for recent changes.

This is currently in ALPHA state, defined as:
* I'm running it in production
* Key features are not missing
* Any data you put in here you should be prepared to reconstruct without the benefit of a migration tool (but I'm going to try very hard to avoid that)
* Security and stability bugs are to be expected.
* Some stable internal APIs will be present.

The next milestone is BETA, defined as:
* Key features are not missing
* Any data you put in here should be able to be migrated with an offline migration where you need to shut down the site momentarily
* Stability bugs are to be expected.
* Stable APIs will be present.

How to get started?
-------------------

### Automated Setup

 * [Docker Compose](https://github.com/rm3web/rm3-docker-compose)

### Other setup methods

 * [Installing rm3](docs/install.md)
 
[Docs](docs)
------------

 * [How to administer your rm3 install](docs/admin.md)
 * [CLI Commands](docs/cli.md)
 * [Environment Variables useful for configuring rm3](docs/cli.md)
 * [And more..](docs)

To generate API docs:

* `npm run docs`

Tests
-----

To test:

* `npm test`

To lint:

* `npm run lint`

To check coverage

* `npm run coverage`

If you want to do some development and not want to log in:

* `RM3_DANGER_FORCE_AUTH='wirehead' gulp develop`
  - **Warning: If you try to do this on a publicly accessible Internet port, you will get hacked**

Benchmarks
----------

* `npm run benchmark`

Contributing
------------

There are a wide variety of ways to contribute.  Documentation, bug triage, detailed issues (including UI/UX, bug reports, etc), test cases, refactoring, artwork, schemes, and so on are all just as important as features.

Sections of the code are kinda messy copypasta that I'm waiting for a good abstraction to refactor.  Patches to fix that are probably even more important than full features.

Please note that this project is released with a Contributor Code of Conduct. By participating in this project you agree to abide by its terms.

[CONTRIBUTING.md](CONTRIBUTING.md) contains more details.

License
-------

GPL, see [LICENSE](LICENSE)
