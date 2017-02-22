Thinking in rm3
===============

As the developer of a piece of software, it makes perfect sense to me.  For all I know, people will just download rm3, install it, see how to make it work, etc.  Still, I thought I'd explain a few concepts that I've build rm3 around so that you can get into my head, just a little bit.

So, please, bear with me.  Put on your best comfy pj's, sit in your geekroom with something from The Synthetic Dream Foundation or the Casket Girls on a good set of speakers (meaning: nothing Bose or Beats) and read on.

A brief sanitized tale of PHP hell
==================================

Some of my coworkers a long time ago were stuck in a problem with performance.  See, they were replacing a giant monolithic content engine that could do a whole lot of traffic on not that much hardware.  It was written in C++ and pulled data out of some heavily optimized in-memory databases.  It was written to be very theoretically pure, used XSLT, and very few people could make heads or tails out of it, so just finding engineers to work with it was extremely hard.  And then they replaced it with a service-oriented application built in PHP that just about anybody could make sense of.

And, as they neared release, people started pointing out that it was 10 times slower than the old system.  Sometimes worse.

It came about very early in the whole Service-Oriented Architecture thing.  So pages were assembled from a bunch of requests.. except that it executed the page in fully serial, with no parallelism.  This meant that the page render time was the sum of all of the underlying service requests.

The problem wasn't that they used a service-oriented architecture.  You can build a different database cluster for each unique type of data instead of trying to jam everything in one database engine and one disk/memory config.  You can break down silos between teams as you scale.  Things like that.  Trust me, I've seen giant monolithic systems without the benefit of services and they sucked.

Heck, the problem wasn't even really PHP.  It was about picking the right tool for the job.  There are ways to parallelize requests in PHP.

The first node.js application I wrote to learn the framework was an asynchronous multi-tiered system, because I thought it would be far easier in node.js instead of php or ruby.  It was.  This is why rm3 is written in node.js.

My goal is to, without resorting to too much bizarre alchemy and complicated code, rm3 should be able to render as much of the page as possible as fast as it can and process the rest with asynchronous parallelism.  This means that it tends to prefer to return database queries row-by-row, avoids holding the entire page in memory at once, and so on.  Now, this makes the code a bit more complex because explicitly evented code is a bit trickier than plain serial code.  Getting a stream of records is harder than being able to work directly upon the records.  But I feel this is a trade-off worth making.

Content management with prototypes
==================================

If you are just storing one type of data, laying out the URL hierarchy and accompanying software hierarchy is easy.

However, once you move from one type of data to multiple types of data... you have to figure out which of the available options for laying out URLs is jamming a square peg into a round hole and which ones build a better flow.  First you've got a blog... but then you want to have a static "about" page that doesn't really work as a blog entry... or photos... and so on.

You might also consider assembling a 'best of breed' solution.  Maybe install the best blog for the blogging section, the best CMS for the static files, the best wiki for the note taking and tracking, etc.  Have you ever tried to make a disparate set of tools from a disparate set of developers look similar enough so that it presents a unified site for the user?

When you move from a single-function site to something that we'd grandiosely call a "content management system", you can view it as a "type" system.  Blog articles are a type.  Images are a type.  Index pages are a type.  Etc.

Now, a hierarchy is the simplest way to provide a rough sorting order for things.  So you can apply your type system to the hierarchy.  This is the usual approach you'd see with a 'best of breed' solution as well as many CMS frameworks.  However, if you've got a picture associated with a blog article, doesn't it make more sense to have that picture stored as a leaf node to the blog article instead of in the photo section?

This is a simple idea, but this underlies rm3 and why it is so dramatically different.  It's just like the filesystem you are accustomed to using.  It's a hierarchy of pages and there's no structure that you are forced into.  The type is not implicit in the path, it's stored as part of the object itself.  

This leads to what I consider a more natural approach to filing things, as long as you are accustomed to a hierarchy.  This leads to very helpful URLs that are extremely descriptive.

However, this also means that we can't derive the properties of the page you have just loaded until you actually look up the prototype for the page.  This is a bit of a complexity hit, but I think it's worth it.

Nerd in a room with newsies
===========================

I'm not a real journalist.  Although, in this age where fact-checkers are laid off and lazy reporters liberally cut-and-paste from press releases, who is?  But I've worked around them enough times to see what a newsroom-styled organization is like.

An editor wants to be able to see what tomorrow's front page looks like today, so they can make sure that at 8 AM tomorrow, it looks perfect.  Most CMS systems don't let them do this.

Also, I really like the wiki model for things where you keep the history going back in time.

These two things are actually the same basic concept, in code.  rm3 lets you have the log move in both directions.  It starts with the first commit, goes up to the present, and then contains any draft versions or scheduled updates into the future.

A real journalist site might also require a layer of actual official editorial approvals before something is allowed to be published.  I don't want to write that, but it's probably better that I don't get in the way of somebody else making that work for this system.

Permissions, RBAC, and Capabilities
===================================

There are some node.js libraries that will implement RBAC for you. The problem is, they don't work in the way I want. Consider the case where a user hits an index and you don't want to show them the things they aren't allowed to know about. I can pull down everything from the database and then post-filter, but this leads to a lot of weird logic down the road with things like pagination. It's better, for the exact case that rm3 is aiming to solve, to push this complexity off to the database, if possible.

I spent a weekend implementing various permissioning schemes against PostgreSQL.

The theoretically correct way to do things is to give each user a ring of capabilities. Each capability is a permission to do exactly one thing. And a user may or may not be given the right to copy those capabilities. It's very easy to know if a user has the capability or not.

Very few systems are actually capability driven. But I wrote a rough capability driven system just because I'm stubborn.

In days past, people talked about ACLs, but that was mostly applied to filesystems.  Most of the time, when people talk about ACLs in terms of web applications... they are actually talking about RBAC.

Many RBAC and ACL systems have what I consider to be a big misfeature.  The second that you create a permissioning system that contains both GRANT-rules and DENY-rules, you are creating a system that is extremely hard to reliably reason about.  In fact, if you read the papers written by the advocates of capability-based systems, this is the biggest critique of the other models.

As it turns out, the RBAC standard that NIST wrote doesn't require DENY-rules, just GRANT-rules, although it doesn't forbid you from adding DENY-rules to your implementation of RBAC if you so desire.

Now, after I wrote a draft pure-capability system and a draft RBAC system in PostgreSQL and started executing queries in EXPLAIN mode, I realized why the RBAC model makes sense.  If you are looking at individual nodes without the capability to gather a directory index, it's about roughly equivalent.  But it's significantly faster to do indexed table scans with the assistance of a smaller number of roles than it is to scan against a list of capabilities.  If you were writing your own database, you could easily optimize the other way around... but one of my explicit goals of rm3 was to not force myself to write my own database (c.f. Zope) and I wrote rm2 against CouchDB and found that it just wasn't providing the necessary richness of tooling.

Thus, rm3 uses RBAC, albeit with some features cheerfully designated as never to be implemented and some features left out for the time being.  I'm targeting NIST's Core RBAC.  I do not think it would ever be a good idea to add the un-specified DENY rules, but hierarchial rules would be great for higher-end instalations and constrained RBAC would be great for Seperation of Duties.  It's just that hierarchial RBAC rules probably need to be done in de-normalized form and the constraints are going to end up being a bit complicated.

After I got knee deep in the implementation of users and RBAC, I realized that I needed to handle a few exceptional cases.  Most of the requests that require authentication are simple -- you are a user and may or may not have permission.  However, I noticed that there's a corner case: Users are stored as pages, just like everything else.  Thus, there is a brief period of time where you need above-average permissions.  Now, I did add the notion of ROOT access, where you've explictly disabled security checking.  But instead of running that as ROOT, I created a context field that lets you instead specify that you are using the USERLOOKUP context to look up a user... and this also means that it will only bypass security checking in that exact query that it expects you to be looking up a user.

Site trees and Metadata
=======================

A hierarchy is the simplest way to provide a rough sorting order for things. This is why rm3 is built around providing simple, clean, and helpful URLs along a hierarchy instead of mounting each page type under a different path hierarchy.

Hierarchies have exceptions, however. Say you have a photo collection containing pictures of bugs and pictures of flowers. What do you do with the picture that contains both bugs and flowers?

A considerable amount of time was spent over the years on the RDF suite of technologies that, so far, have not caught on.

Tagging, on the other hand, has caught on quite well.

RDF can be viewed as tags on steroids. It lets you make tags like 'urn:hymenoptera:formicidae:ponerinae:pachycondyla:verenae' to unambiguosly describe one particular ant specifes usually found in Costa Rica. Layers of protocols and specifications let you establish equivalencies and relationships between tags so that you could, in theory, do reasoning upon a collection of records where some tags are in one format and some are in a different format.

This is all, of course, way too complex for most people. So I tried to take the good bits and offer them in a usable fashion.

rm3 will allow you to create tags, just like everything else. But rm3 will also let you create tags that are unambiguous (I'll call them ontags, short for 'ontological tags') and point to a definition.  So I can create an ontag where you know I'm talking about my Olympus PEN, and not a pen.

Furthermore rm3 will allow you to use predicates.  Optionally, of course.  This way, I can create a predicate for "Camera used to take this picture" and do a query on that predicate to get a list of cameras I've used.  And if I search for the predicate of "Camera used to take this picture" and the tag of "Olympus PEN E-P3" that I'll get only photos taken with my E-P3, not a blog article where I talk about it or a picture of my E-P3 that I took with my cell phone.

A semi-guided tour of auth standards and Rm3
============================================

Any given instance of Rm3 is destined to be a 'minority' platform.  Thus, unlike large services like Twitter and Facebook, the traditional methods of authentication don't work.

To understand what I'd like to do, let's go through a history lesson.

Originally, it was seen as OK for you to give other people your login credentials and/or to generate a special URL that you shared with another service.  But that's a pretty bad way to do things.

Then a few providers did various simple little APIs, all of them incompatible, to authenticate with the API.  This way, they still took you to a page on their site where you said "Hey, I'm OK with this particular application having one set of permissions".

Then OpenID and OAuth 1.0 came along.  Bugs were found in both, new versions pushed.

Eventually, they realized that next to nobody could implement OAuth 1.0 properly, so OAuth 2.0 was created.  And OAuth 2.0 assumes that everything is happening over TLS and therefore the rest of the algorithms are easier.

People hate on OAuth 2.0 for security issues and they are kinda right, because all of that effort in making it easy to use also creates opportunity for exploits.  We'll kinda ignore a lot of that for now because everything in security is horrible and it's even worse if you've worked with genuine security experts who explain everything you didn't know.

There are real other non-security problems with OAuth 2.0.  The biggest one is that nobody actually implements it the same way; in fact the standard is sufficently vague that it's impossible to tell in some cases what's the best right way.  You can avoid some of this by using a standard library such as oauth2orize instead of rolling your own.

Furthermore, OAuth 2.0 was designed for the needs of large sites.  Thus, you have to request an API key that contains an ID and a secret.

Enter OpenID Connect, which is tantalizingly close.  If you implement the optional [Dynamic Client Registration](http://openid.net/specs/openid-connect-registration-1_0.html) protocol, you don't need to force everybody to go through a non-automated API key request process.  If you implement the optional [Discovery](http://openid.net/specs/openid-connect-discovery-1_0.html) protocol, you can avoid making the user need to think about what the paramaters for the OpenID server are.

Controlled tech debt
====================

The general principle that I've followed with rm3 is "Controlled tech debt".  This isn't necessarily a development pattern that works everywhere, it only works in some situations.

The primary idea behind this is that you frequently can't see the best abstraction for a given situation until you've got 2-3 examples of almost-but-not-quite-identical code.  Furthermore, sometimes you can't see the best abstraction until the rest of the system is a bit more mature.  You might put in a really good localized abstraction and then have to rip it all out for a more global abstraction later.  Thus, prefer duplication over the wrong abstraction.

Therefore, there's some messy segments of rm3 that are just waiting for the right abstraction to turn them into something neater and more compact.  Or there's a very brute-force easy-to-rip-out abstraction instead of a nice one.

The downside of this approach is that you frequently find yourself unable to refactor the code later on.  Furthermore, you may forget where the nasty bits are.  Thus, create 'tech debt' tickets and ensure that they move through the pipeline.  The tech debt ticket needs to be significantly more verbose than you'd think.  You should always tie some tech debt tickets to any feature milestone.

Furthermore, sometimes it's better to avoid adding a feature that the system doesn't have the infrastructure to support.

The knob can be turned, over time.  Between 0.1 and 0.3, I specifically created some tech debt to get things to the point where the rest of the system could have more useful abstractions.  Between 0.3 and 0.4, I juggled tickets to force myself to take care of at least some of those issues.