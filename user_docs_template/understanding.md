Understanding rm3
=================

Pages
-----

The basic unit of content in rm3 is the page.  A single website could contain a lot of different types of content... polls, news articles, for-sale listings, musical scores, photos, etc... but for the most part, all of them are just different types of pages.

Pages exist in a tree.  There's a single page for the front-page of the site.  You might create sections as an index page, then post a blog underneath the index page, where the photos you add to the blog article are child pages, and any comments are also represented as child pages of the blog article.

Revision history
----------------

A given page is going to change over time.  You might start with a few words that you saved, expand it to an article, post it, and then schedule a new version of the article to be posted next week.

All of this is represented as a log.  It goes backwards in time, has a pointer that represents where it is now, and then extends forwards in time to handle drafts and scheduled updates.

Protos
------

Because pages need to represent different types of content, a page has a 'proto'.  rm3 comes with a set of generic protos, and you can add your own or deploy other people's modules.

Tags
----

Text blocks and indicies
------------------------

Users
-----

Credentials
-----------

Identities
----------

Roles and permissions
---------------------