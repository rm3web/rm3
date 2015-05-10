rm3
===

What is it?
-----------

rm3 is a system for managing stuff on the web. It's a little more than just a blog engine, but a little less than an enterprise CMS. It is to Drupal as Ghost is to WordPress. When farther along, it will be able to be used as a blog, or a wiki, or a photo archive, or a combination of things. Like a blog, it lets you create a series of blog articles in a collection. Like a wiki, it maintains a history of all changes.

How to get started?
-------------------

* Git clone this repo
* Create the database in postgresql
  * `createdb rm3test`
  * `psql rm3test < db-schema.sql`
* Load some default content
  * `./bin/rm3load -f default_frontpage.json`
  * `./bin/rm3load -f default_users.json`
* Add a user and assign them to the root group
  * `./bin/rm3admin adduser wirehead "Some New USer" -p "Some profile text" -u http://www.wirewd.com/ -e email@example.com --password password`
  * `./bin/rm3admin assign wirehead root`
* Add permissions for the root group
  * `./bin/rm3admin permit root edit \*`
  * `./bin/rm3admin permit root delete \*`
  * `./bin/rm3admin permit root view \*`
* Add permissions for the special 'nobody' group
  * `./bin/rm3admin permit nobody view wh.!users`
* Run it
  * `gulp develop`

Docs
----

To generate API docs:

* `npm run docs`

Tests
-----

To set up testing environment:
* Install dev deps
* `createdb rm3unit`

To test:

* `npm test`

To lint:

* `npm run lint`


Benchmarks
----------

* `npm run benchmark`
