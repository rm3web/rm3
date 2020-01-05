rm3
===

A platform for publishing more than just textual articles on the web.
---------------------------------------------------------------------

[![CircleCI](https://circleci.com/gh/rm3web/rm3.svg?style=svg)](https://circleci.com/gh/rm3web/rm3) [![codecov.io](http://codecov.io/github/rm3web/rm3/coverage.svg?branch=master)](http://codecov.io/github/rm3web/rm3?branch=master) [![Dependency Status](https://david-dm.org/rm3web/rm3.svg)](https://david-dm.org/rm3web/rm3) [![npm version](https://badge.fury.io/js/rm3.svg)](https://badge.fury.io/js/rm3)

What is it?
-----------

rm3 is not just a blog engine, but it's still lighter-weight and friendlier than those enterprise-grade CMS systems.  It can be used to drive a large site, but I don't want to lose sight of being something that a person can install on a micro cloud instance and use themselves.  Conceptually, it is to Drupal as Ghost is to WordPress.

rm3 is able work as a blog, a wiki, a photo archive, or some combination of those... and more.  It's got blog-styled views such that you can post a series of dated blog articles and view them as such.  But every entity on the site has a history, like how a wiki works.  Like some of those enterprise CMS systems, you aren't restricted to just creating a mere list of posts.  You can use it to manage links, photos, graphics (both photos and SVG vector graphics), and audio.

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

If you want to do some development with auto-restart:

* `gulp develop`

Benchmarks
----------

* `npm run benchmark`

Contributing
------------

There are a wide variety of ways to contribute.  Documentation, bug triage, detailed issues (including UI/UX, bug reports, etc), artwork, schemes, and so on are all just as important as code.  Similarly, cleaning up the messy abstractions and copypasta, writing unit tests, and other non-feature tasks are probably more valuable to me.

Please note that this project is released with a Contributor Code of Conduct. By participating in this project you agree to abide by its terms -- see [code of conduct](code_of_conduct.md)

[CONTRIBUTING.md](CONTRIBUTING.md) contains more details on contributing.

License
-------

GPL, see [LICENSE](LICENSE)
