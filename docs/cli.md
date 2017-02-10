CLI Tooling for rm3
===================

rm3 has CLI commands for operations that either ought to be automated at least some of the time or are too dangerous to have exposed on the web front-end because they might really break things.

Also, a few operations are only available via the CLI, in the absense of a bit more UI work.

All of the CLI tooling should be at least a little bit self-documenting.  Use the `--help` option to see all of the available options.

If you `npm install rm3` into a directory, these should be available in the ./node_modules/.bin/ directory.

**Warning: These operations ignore the permissions system entirely and may have dangerous consequences.**

rm3load
--------

Loads a single document from either a JSON file or stdin.

Example:

* Load default_frontpage.json `./bin/rm3load -f default_frontpage.json`
* Load page.json and change the path to `wh.blah` `./bin/rm3load -f page.json -p wh.blah`
* Load a backup stored in folder `backup`: `./bin/rm3load -d backup`

rm3dump
-------

Dumps a node to the console.

* Dump wh.users page to stdout `rm3dump -p wh.users`
* Dum wh page to stdout, with history, in a more readable format `./bin/rm3dump -lfp wh`

rm3backup
---------

Fills a directory with a semantic backup.

`rm3backup backupdir` will copy the contents of the site into the directory `backupdir`.

In order to make sure that there aren't accidentally any excess files included in the backup, it requires an empty directory.

rm3rm
-----

rm3rm will delete entites from the site.

`rm3rm wh.the_meat` will delete an entity just like you'd expect if you deleted it via the web.

`rm3rm -E wh.the_meat` will forcibly delete everything about the entity.  It will be as if it never existed (although any blob files will remain).  This is a dangerous operation.

rm3mv
-----

rm3mv will move a node

`rm3rm wh.the_meat wh.meat` move an entity from the first path to the second path.

Warning: This won't move things that have blobs right now.

rm3admin
--------

rm3admin is the swiss-army chainsaw of the tooling, comprising all of the sophisticated admin tasks

### rm3admin loadtemplate

./bin/rm3admin loadtemplate meta.json wh

### rm3admin adduser

To add a user wirehead, with a name of "Ken Wronkiewicz", with a profile text, a url, an email address, and a password: `rm3admin adduser wirehead "Ken Wronkiewicz" -p "Some profile text" -u http://www.wirewd.com/ -e email@example.com --password password`

### rm3admin userinfo

To get a list of permissions for user wirheead: `rm3admin userinfo wirehead`

### rm3admin assign / rm3admin deassign

To assign wirehead to a group root: `rm3admin assign wirehead root`

To undo this: `rm3admin deassign wirehead root`

### rm3admin permit / rm3admin deny

To add 'edit' permission to the root group: `rm3admin permit root edit \*`

To revoke it again: `rm3admin deny root edit \*`

### rm3admin roleusers

To list the users in the root group: `rm3admin roleusers root`

### rm3admin roleinfo

To list the permissions that the root group has: `rm3admin roleinfo root`
