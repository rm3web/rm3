ETags, Caching, rm3 and performance
===================================

Part 1: The front end
---------------------

[rfc7234](https://svn.tools.ietf.org/svn/wg/httpbis/specs/rfc7234.html) contains most of the important details about how caching work in the real world.

### Page-level caching is meant to be done by an external process

In days past, you'd frequently see a page cache built-in to your web framework.  This is, at this point in time, bad practice.  If you remove the caches from your page generation process, you have a process that's got a fairly fixed, comparatively small memory footprint that you can scale in one fashion... and then you've got a separate cache process that's got a larger memory footprint that you can scale separately, potentially even on different pools of machines.

Therefore, rm3 doesn't attempt to cache rendered pages.

### The accurate and correct generation of ETags is critical to performance

There are two mechanisms for cache validation allowed in the HTTP standard.  First, you can set a Modified date.  This is sensitive to the accuracy and synchronization of clocks, thus it's highly likely to create error conditions.  Second, you can provide an opaque string called an ETag.  Assuming that you are able to generate coherent ETags, this mechanism is more durable.

For cachable responses, a browser or intermediate cache can add "If-Modified-Since:" and "If-None-Match:" headers such that if the response is unchanged, the user gets a 304 Unmodified response instead of a 200 OK with the results.

The earlier this is done in the request lifecycle is also critically important.  It's easy to generate a page, then use the MD5 or SHA1 hash of the page to generate an ETag, but if that page requires a set of database requests and CPU-intensive render functions, you aren't really going to see much of a performance increase.

Furthermore, while it needs to be done before you actually try to render the page, it needs to be done after you've checked security, otherwise you are leaking small amounts of information -- A contrived example, but if there's a page on a wiki somewhere called "Layoff list" and I can see that it exists and it's been modified lately, I can tell a company is planning layoffs without actually having access to the page.

Thus, the rendering pipeline first checks security, then determines the cache control policy and ETag and determines if it can output a 304 Unmodified, then it starts the actual work of rendering the page.

Furthermore, the rendering needs to consider the overall site map.  A page usually contains a navbar with other pages, whenever a new page is added, the ETags need to change.

Therefore, by default rm3 generates part of the ETag using the page's revision ID, part of the ETag as the last revision ID on the site, and adds a suffix when there's a flashed message or the user is logged in.  If there's a flashed message or the page is otherwise very user-specific, the page will be marked as uncachable.

Also, there's a middleware that adds utility functions to specifiy that something is probably user-level-cachable or clearly uncachable.  And an individual page can override the cache control and ETag generation as necessary.

### The Session Cookie problem

Having a different set of URLs for logged in users than anonymous users on the Internet breaks the basic working model of things and creates UI problems.  Even worse: The UI problems it breaks makes it hard to drive organic growth to your site by preventing people from copying a URL and pasting it to their friends.

Thus, a site must return ETags, Cache-Control, and Vary headers appropriate for the case where a user's identity is determined by a persistent session cookie, so that you can put a simple HTTP cache in front of the site without worrying about users getting content not intended for them.

In rm3 and many node.js apps, the keys to that kingom is a single HTTP session cookie.  It won't be created untill necessary, ideally, so that the user stays un-tracked as long as possible by the session management system and thus the majority of the users are going to get a mostly un-customized page that's easy to cache... tracking user activity for analytics purposes generally should be done via a separate mechanism for this reason.

There are some commonly-used modules in npm that disobey the "don't create a session untill absoutely necessary" edict, the big one being connect-flash (And I checked in Aug 2016 and there were patches in the github for fixing that exact issue, but the maintainer hasn't been merging them and there were a bunch of alternative libraries, but nothing that's a clear migration path)

Therefore, rm3 uses a customized connect-flash replacement and is otherwise configured to avoid creating a session ID until necessary.

### Edge Side Includes (not yet implemented)

Apache, nginx, squid, varnish, and many of the popular content delivery networks implement Edge Server Includes.

Furthermore, there are libraries to execute ESI's on the node.js side, thus a user can experiment with rm3 and not be required to correctly install and configure the entire stack.

With ESIs, you can cache portions of a page, which therefore means that for all of those users that have a Session ID cookie set, they can still take advantage of the page cache.

This is on the list of things that eventually need to be done.

### Cache invalidation (not yet implemented)

rm3 has a fairly good notion of when the back-end changes.  It should be able to invalidate the cache for you, thus letting you keep the contents of the cache static for days or weeks.

This is on the list of things that eventually need to be done.

### Putting this all into practice

rm3 generates cache control headers that specify a 'private' cache, which means that if you are connecting without a front-end process to rm3, it'll work correctly.

Some caches are configured by default to treat themselves as specialized caches and will, by default, cache 'private' content.  Otherwise, you may need to configure them to ignore the 'private'.

#### Apache2 caching

You should just be able to, after making sure that mod_cache is installed, add this snippet to your site's config:

```
   <IfModule mod_cache.c>
    CacheLock on
    CacheLockPath "/tmp/mod_cache-lock"
    CacheLockMaxAge 5
    CacheDetailHeader on
    CacheEnable disk /
    CacheStorePrivate On
  </IfModule>
```

Apache2 doesn't automatically clean up the cache drive, so you probably want to use htcacheclean on a regular basis.  The manual isn't entirely clear about this, unfortunately.  If the site content doesn't change too often, you can just set up a daily cache-clean job that works something like this:

```
9 2 * * * www-data htcacheclean -n -l100M -p/var/cache/apache2/mod_cache_disk/
```
(where `www-data` is the apache2 user, `/var/cache/apache2/mod_cache_disk/` is the cache path and `100M` is the size of the cache that you want to preserve)

Or you can use -d to run htcacheclean in daemon mode.

#### nginx caching

**This section will improve as rm3 approaches 1.0**

#### Varnish caching

**This section will improve as rm3 approaches 1.0**

Part 2: The back end
--------------------

In the front-end, your data is definately cached in the browser, hopefully cached in the front-end server, and potentially cached at other points in between.  However, all of this is built on the guarantees provided by the ETag from the back-end.

Thus, the fastest and most efficient front-end cache is still going to run into troubles if it cannot reply with an ETag fast enough.

The cache for rm3 is very much a visible cache, as opposed to a fully automated cache that intercepts SQL queries and tries to do the right thing for you.

You should feel free to zap the redis cache (but not the session redis) if needed.  There are no keys stored there that can't be replaced from elsewhere.