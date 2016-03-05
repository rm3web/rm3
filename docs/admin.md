Administration of your rm3 install
==================================

Setting up for real
-------------------

**This section will improve as rm3 approaches 1.0**

rm3 is designed to be neutral to any particular devops working framework.  It should be able to work within a container-styled infrastructure just as easily as on Chef or Puppet managed nodes.

rm3 is designed to work using npm.  Thus, the desired state for a new install of rm3 is that you will create a package that depends on the `rm3` package, as well as any accessory plugin modules, and then run from that package.  Schemes and plugins and so on are all also delivered as accessory modules.

npm is pretty good about pulling from wherever.  If you have site-specific modules, you can npm install from any random git repo or tarball URL.

Your install package can be checked into github, so you can keep track of versions.

### Service supervision

Production apps tend to work best when they are run with process supervision.  With Docker, you can just set a restart policy to restart the container when it crashes.

### HTTP proxy

**Note: You probably don't want to turn on caching right now.**

You want to put a proxy in front of rm3, nginx or Apache.

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

### Database table backup

A database backup should be able to get you out of most simple failures quickly.  You can use a file rotation tool to store it back in history so you can go back in time before a database corruption.  

You should be able to back up the postgresql cluster.

A CLI command like `pg_dump -Fc <database name>` should generate a dump file to standard out that you can redirect into a file and then load later on with `pg_restore`

In practice, I've used (https://github.com/backup/backup)[the ruby backup gem] because it turns what is otherwise an obnoxious problem into a pleasant DSL.

You can also use (https://github.com/wal-e/wal-e)[wal-e] to get a continuous streaming backup, if you expect to see plenty of updates.

Either way, you should have this automated, tested, and monitored.  I have a crontab to run a backup job.  I also created a check in my monitoring system to enforce a minimum dump size and freshness time that doesn't go off unless it's a few hours late.  You might consider also loading your dump into a secondary database, just in case.

**This may not save you from all possible problems**.  As a general rule, if there's a weird semantic corruption of the database in ways the developers haven't seen ever before, loading a table dump might put you back where you started.  Thus, a semantic backup is also important.

### Semantic backup

**Not ready yet**

Failure Recovery
----------------

**This section will improve as rm3 approaches 1.0**

Tuning
------

**This section will improve as rm3 approaches 1.0**
