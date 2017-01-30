Installing rm3
==============

Automated setup
---------------

### Docker Compose

[Docker Compose](https://github.com/rm3web/rm3-docker-compose)

Manual Setup
------------

* Install PostgreSQL 9.4 or later.  See [PostgreSQL installation](http://www.postgresql.org/download/linux/ubuntu/) -- you want to install it off of the PostgreSQL Apt Repository if your operating system doesn't package 9.5 or newer
* Install node.js 4.4 or later (node.js 6.0 is not yet supported).  See [NodeJS install via package manager](https://nodejs.org/en/download/package-manager/)
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
  * `./bin/rm3admin createworkflow`
* Load some default content
  * `./bin/rm3load -f default_frontpage.json`
  * `./bin/rm3load -f default_users.json`
  * `./bin/rm3admin loadtemplate base_access.json wh`

* Run it
  * `./node_modules/.bin/gulp develop`
  * In the template a user named "wirehead" is created with a password of "password".