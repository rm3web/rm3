rm3
===

[![Build Status](https://travis-ci.org/rm3web/rm3.svg?branch=master)](https://travis-ci.org/rm3web/rm3) [![codecov.io](http://codecov.io/github/rm3web/rm3/coverage.svg?branch=master)](http://codecov.io/github/rm3web/rm3?branch=master) [![Dependency Status](https://david-dm.org/rm3web/rm3.svg)](https://david-dm.org/rm3web/rm3) [![npm version](https://badge.fury.io/js/rm3.svg)](https://badge.fury.io/js/rm3)

What is it?
-----------

rm3 is a system for managing stuff on the web. It's a little more than just a blog engine, but a little less than an enterprise CMS. It is to Drupal as Ghost is to WordPress. It can be a blog, a wiki, a photo archive, or a combination of all of that and more.  Like a blog, it lets you create a series of blog articles in a collection. Like a wiki, it maintains a history of all changes.  Like a CMS, it lets you create a site with more structure than a mere list of posts.  It has good support for both SVG vector graphics and photos.

Release Status
--------------

This is currently in PRE-ALPHA state, defined as:
* I'm not yet trying to run this in production, so you definitely shouldn't.
* Any data you put in here you should be prepared to reconstruct without the benefit of a migration tool.
* Security and stability bugs are to be expected.
* Key features are missing.
* The basic structure of code is assumed to be unstable and any APIs are subject to change

The next milestone is ALPHA, defined as:
* Key features are not missing
* Any data you put in here you should be prepared to reconstruct without the benefit of a migration tool.
* Security and stability bugs are to be expected.
* Some stable internal APIs will be present.

How to get started?
-------------------

### Automated Setup

[Docker Compose](https://github.com/rm3web/rm3-docker-compose)

### Manual Setup

* Install PostgreSQL 9.3 or later.
* Install node.js 4.4 or later.
* Install Redis 2.0 or later.
* Install LibRSVG library and header files (see https://www.npmjs.com/package/librsvg)
* Git clone this repo
* `npm install`
* Create the database in postgresql
  * Set up a password and user.
    * The default setup is to assume it can connect to a database named `rm3test` with username `wirehead` and password `rm3test`.  An example database setup sequence, assuming that the default installed admin PostgreSQL user is `postgres`:
      * `psql -c 'create database rm3test;' -U postgres`
      * `psql -c "CREATE USER wirehead WITH PASSWORD 'rm3test';" -U postgres`
      * `psql -c "GRANT ALL PRIVILEGES ON database rm3test TO wirehead;" -U postgres`
      * `psql -c "ALTER USER wirehead WITH SUPERUSER;" -U postgres`
    * You can set the RM3_PG environment variable to something different if you want a different database username and password (and definitely should, if you want to run this in production)
  * `createdb rm3test`
  * `psql rm3test -U wirehead < db-schema.sql`
* Load some default content
  * `./bin/rm3load -f default_frontpage.json`
  * `./bin/rm3load -f default_users.json`
* Add a user and assign them to the root group
  * `./bin/rm3admin adduser wirehead "Some New User" -p "Some profile text" -u http://www.wirewd.com/ -e email@example.com --password password`
  * `./bin/rm3admin assign wirehead root`
* Add permissions for the root group
  * `./bin/rm3admin permit root edit \*`
  * `./bin/rm3admin permit root delete \*`
  * `./bin/rm3admin permit root view \*`
* Add permissions for the special 'nobody' group
  * `./bin/rm3admin permit nobody view wh.!users`
* Run it
  * `./node_modules/.bin/gulp develop`

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

Please note that this project is released with a Contributor Code of Conduct. By participating in this project you agree to abide by its terms.

[CONTRIBUTING.md](CONTRIBUTING.md) contains more details.

License
-------

GPL, see [LICENSE](LICENSE)
