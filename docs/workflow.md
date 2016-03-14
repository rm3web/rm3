Work queues and rm3
===================

You'd think, given that Rm3 is all written in node.js and thus it's not actually the end of the world for a given HTTP connection to stay open a bit longer than usual and thus it's OK for Rm3 to just do all of the work in the create method.

On the other hand, a good durable worker system offers a lot of advantages.  You can create worker-nodes and autoscale them up and down in response to upload demand.  You could build a transcoding system for multi-hour videos if you wanted to write a white-label video service.  Things like that.

A work queue needs to be more than a plain queue system.  Yes, it needs to present the abstraction of a queue that you can insert data into on one side and remove data from on the other.

It also needs to handle cases like this:
 * Transient job failures (Where something fails once, but can be retried)
 * Errored jobs (Where, every time you try it, it dies)
 * Worker nodes being killed mid-transaction.
 * Worker jobs that cause a process crash
 * Worker jobs that get stuck and never progress
 * Infrastructure failure

Given that rm3 has a heavy dependency upon PostgreSQL, it seemed like a mostly logical choice to use a PostgreSQL work queue instead of a Redis work queue.

Unfortunately, most of the libraries available on npm for PostgreSQL work queues don't have explicit test cases for handling these errors.