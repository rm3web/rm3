Administration of your rm3 install
==================================

Setting up for real
-------------------

**This section will improve as rm3 approaches 1.0**

rm3 is designed to be neutral to any particular devops working framework.  It should be able to work within a container-styled infrastructure just as easily as on Chef or Puppet managed nodes.

I felt it was important that rm3 core run in a 'semi-batteries included' sort of way, such that you could play with it easily.  However, if you are going to run a site 'for real', you want to create a custon npm package for installation purposes with all of the dependencies bundled and versioned.  This way, your plugins are isolated, so you can update them separately and not worry as much about maintaining patches against rm3 as it develops.  And this also means I don't need to implement a bad ersatz version of everything npm already does for you.

Thus, the desired state for a new install of rm3 is that you will create a package that depends on the `rm3` package, as well as any accessory plugin modules, and then run from that package.  Schemes and plugins and so on are all also delivered as accessory modules.

Once you've created the package, you probably want to store it in some sort of revision control system like git (maybe a github or gitlab repo).  npm can be set to install a package from a git repo or a tarball, so this doesn't mean that you have to publish your potentially sensitive config with packages you don't really want to have out in the public to npm.

1. Make a subdirectory to hold your new package: `mkdir rm3-demo`
2. Initialize a package: `npm init` (You can just hit enter a few times)
3. Install rm3: `npm install rm3`
4. Customize...

**This section will improve as rm3 approaches 1.0**

### Service supervision

Production apps tend to work best when they are run with process supervision.  With Docker, you can just set a restart policy to restart the container when it crashes.

### HTTP proxy

**Note: You probably don't want to turn on caching right now.**

You want to put a proxy in front of rm3, nginx or Apache.  The proxy is there to handle static resources (the files for the scheme, as well as the static blobs if you've implemented those) and also to load-balance between rm3 instances.  Remember, node.js is asynchronous but not parallel, so a single rm3 process can only utilize one CPU.  You can tune the number of proxy processes against the number of rm3 processes as needed.

Furthermore, the front-end proxy can handle tasks like DDoS protection.

### Avoid giving users access

This is pretty standard for most web software, but just to remind you:  If a person has access to the user account running an rm3 process, root on the machine running rm3, or the database... they have unrestricted abilities to rm3.

Running rm3 as a separate user is probably a good idea.

### Some things to think about before you go live.

* Delete the database and recreate everything from backup
* Set it up on a 'junk' cloud node or nodes, then delete everything and make sure the setup process works with new nodes.

Updating
--------

**This section will improve as rm3 approaches 1.0**

rm3 uses semantic versioning.

As rm3 is very much a pre-release piece of software, updates are expected to be destructive and messy.

The eventual goal is that updates will work in a seamless zero-downtime fashion, of course.

Reconfiguring an existing install
---------------------------------

**This section will improve as rm3 approaches 1.0**

Protecting secrets
------------------

rm3 tries to be as careful with your secrets as it can be.  Different systems try to handle secrets in different ways and the "12 factor" way of requiring secrets to be passed in environment variables means that rm3 can fit into whatever way you want.

Kubernetes, for example, has the notion of a secrets store that you can mount as a filesystem.  So you might need to create a startup script that fetches the secrets from the Kubernetes secret store or Hashicorp Vault and feeds them into the app.

Logging & Metrics
-----------------

**This section will improve as rm3 approaches 1.0**

Monitoring
----------

**This section will improve as rm3 approaches 1.0**

Obviously, you want an HTTP check.  You want to look for a string pattern towards the end of the page, say something in your scheme's footer, to ensure the page is being rendered.

Diagnostics
-----------

**This section will improve as rm3 approaches 1.0**

Backups
-------

**This section will improve as rm3 approaches 1.0**

There are two ways to back up rm3.  Both of them are equally important because each one will get you out of a different sort of problem.

Either way, you should have this automated, tested, and monitored.  I have a crontab to run a backup job.  I also created a check in my monitoring system to enforce a minimum dump size and freshness time that doesn't go off unless it's a few hours late.  You might consider also loading your dump into a secondary database, just in case.

A backup to the same machine that's hosting the site is not much of a backup at all.  You want it off somewhere else... your home system, another cloud server, or uploaded to a cloud file hosting provider.

Furthermore, you really want to rotate your backups.  Depending on performance, take a backup every few hours, but keep daily, weekly, and monthly backups.

A backup necessarily needs to contain sensitive stuff like passwords, so you probably should encrypt them.

If you are hosting a site with a lot of images, be warned that your backups could get very large because the backup must necessarily contain all of the images.

### Database table backup + File Blob store backup

The contents of rm3 is stored both in the database and the blob store.  You cannot just backup the database, you also need to backup the blob store.

A database backup should be able to get you out of most simple failures quickly.  You can use a file rotation tool to store it back in history so you can go back in time before a database corruption.

A CLI command like `pg_dump -Fc <database name>` should generate a dump file to standard out that you can redirect into a file and then load later on with `pg_restore`

In practice, I've used [the ruby backup gem](https://github.com/backup/backup) because it turns what is otherwise an obnoxious problem into a pleasant DSL.

You can also use [wal-e](https://github.com/wal-e/wal-e) to get a continuous streaming backup, if you expect to see plenty of updates.

**This may not save you from all possible problems**.  As a general rule, if there's a weird semantic corruption of the database in ways the developers haven't seen ever before, loading a table dump might put you back where you started.  Thus, a semantic backup is also important.

You also need to backup the blobs; those are currently configured to the directory set in `RM3_LOCAL_BLOBS`.

To restore, you should be able to load the database backup, place the blobs where rm3 expects them, and everything will be fine.

### Semantic backup

`rm3backup <directory>` will create a directory named `<directory>` with a semantic backup.

There's a file called `catalog.json` in that directory that describes what the backup contains.  It will create at least one file per entity, where the primary entity dump is located in a file suffixed by `-data.json`, where the blobs have a different suffix.

The credentials (passwords, OAuth tokens, etc) are stored in `credentials.json` and the permissions (e.g. which users have root) are stored in `permissions.json`.

There are a lot of ways to go from here.  Again, in practice, [the ruby backup gem](https://github.com/backup/backup) will make this process go a bit more smoothly.

You can use rsync or similar mechanisms to speed up remote backups.  You want to delete or move the existing backup (rm3backup requires the directory to not exist, so it doesn't accidentally write an incoherent backup), run rm3backup, then trigger the rsync with the `--delete` flag to make sure that backup doesn't leave any extraneous deleted nodes around.

It is significantly easier to edit a backup from rm3backup than it is to edit a backup from the database, although you should consider even the act of editing the database as a highly dangerous operation that might cause issues.

**Currently, rm3load does not try to load revision history, although rm3backup is set up to store it; therefore history serialized by rm3backup with v0.2 might have issues.**

Failure Recovery
----------------

**This section will improve as rm3 approaches 1.0**

### Zapping the workflow

Sometimes the workflow system can get into a bad state.  To kill everything in the workflow system and set it all up all over again, you can first execute these SQL statements against your database:
```sql
drop table wf_jobs;
drop table wf_jobs_info;
drop table wf_runners;
drop table wf_locked_targets;
drop table wf_workflows;
```

And then you can create the workflows again: `./bin/rm3admin createworkflow`

Tuning
------

**This section will improve as rm3 approaches 1.0**
