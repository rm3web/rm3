rm3
===

[![Build Status](https://travis-ci.org/rm3web/rm3.svg?branch=master)](https://travis-ci.org/rm3web/rm3) [![codecov.io](http://codecov.io/github/rm3web/rm3/coverage.svg?branch=master)](http://codecov.io/github/rm3web/rm3?branch=master) [![Dependency Status](https://david-dm.org/rm3web/rm3.svg)](https://david-dm.org/rm3web/rm3)

What is it?
-----------

rm3 is a system for managing stuff on the web. It's a little more than just a blog engine, but a little less than an enterprise CMS. It is to Drupal as Ghost is to WordPress. When farther along, it will be able to be used as a blog, or a wiki, or a photo archive, or a combination of things. Like a blog, it lets you create a series of blog articles in a collection. Like a wiki, it maintains a history of all changes.

Release Status
--------------

This is currently in PRE-ALPHA state, defined as:
* I'm not yet trying to run this in production, so you definitely shouldn't.
* Any data you put in here you should be prepared to reconstruct without the benefit of a migration tool.
* Security and stability bugs are to be expected.
* Key features are missing.
* The basic structure of code is assumed to be unstable.

The next milestone is ALPHA, defined as:
* Key features are not missing
* Any data you put in here you should be prepared to reconstruct without the benefit of a migration tool.
* Security and stability bugs are to be expected.
* Some stable internal APIs will be present.

How to get started?
-------------------

* Install PostgreSQL 9.3 or later.
* Install node.js 0.12 or later.
* Install LibRSVG library and header files (see https://www.npmjs.com/package/rsvg)
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
----

To generate API docs:

* `npm run docs`

Tests
-----

To set up testing environment:
* `npm install --dev`
* `createdb rm3unit`

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

Feel free to submit PR's or bugs.

Please note that this project is released with a Contributor Code of Conduct. By participating in this project you agree to abide by its terms.

License
-------

GPL, see LICENSE.txt
