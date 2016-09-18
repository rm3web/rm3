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

Work queues inside of rm3 are used for a variety of tasks, primarily processing posted images.

Choosing a workflow engine
--------------------------

Given that rm3 has a heavy dependency upon PostgreSQL and PostgreSQL has fairly robust ACID transactions, it seemed like a mostly logical choice to use a PostgreSQL work queue instead of a Redis work queue or requiring the user to add a separate system.

Unfortunately, most of the libraries available on npm for PostgreSQL work queues don't seem to have robust support for all of the failure cases.  For the most part, I looked through the test suite and rejected everything that didn't specifically test a bunch of failure cases.

In the end, node-wf was picked because it's been out the longest and contains a fairly robust set of features.

Workflow logic has been wrapped behind a facade; it should be possible down the road to replace the existing workflow engine with another similar engine.  An externally-hosted workflow engine such as Amazon's SWF would be a natural second option, for users on that cloud.