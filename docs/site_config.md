Site configuration for your rm3 install
=======================================

**This section will improve as rm3 approaches 1.0**

There's not yet a proper configuration interface for rm3.  I figured if I wrote it now, I'd have to re-arrange everything about it later.

Manually editing the site configuration
---------------------------------------

**This section will improve as rm3 approaches 1.0**

The differentiation is that the things that need to be specially injected at startup, or without which the entire system would be unable to come up, should be added via [environment variables](env.md).  Things like which database to connect to and crypto tokens and such.

Site configuration, on the other hand, is stored inside of the database.  Right now, only a 'default' site is supported.

To update the site's name:
```
UPDATE wh_siteconfig SET data = '{"name": "WireWorld"}' WHERE path='site' AND site='default';
```

To update the url root (the path that URLs are generated against) or the path root (the root of all internal rm3 paths):

```
UPDATE wh_siteconfig SET data = '{"root": "wh", "urlroot": "http://127.0.0.1:4000"}' WHERE path='sitepath' AND site='default';
```

To make the login visible or invisible:
```
UPDATE wh_siteconfig SET data = '{"visible": true}' WHERE path='login' AND site='default';
```