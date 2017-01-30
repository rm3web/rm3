var SchemeHelpers = require ('../../lib/schemehelpers');
var SitePath = require ('sitepath');
var should = require('chai').should();
var dust = require('dustjs-linkedin');
var dustRender = require('../lib/dustrender.js');

SchemeHelpers.installDust(dust, {}, {});

describe('schemehelpers', function() {
  describe('#schemeStaticResource', function() {
    var scheme = {
      getResourcePath: function(path) {
        if (path === 'lof') {
          return 'loafPath';
        }
      }
    };

    it('works', function(cb) {
      var siteTemplate = "{@schemeStaticResource path=\"lof\" /}";

      dustRender(dust, siteTemplate , 'schemehelpers.schemeStaticResource', {scheme: scheme}, 'loafPath', cb);
    });
  });

  describe('#toISOString', function() {
    var dottedPathTemplate = "{myInput|toISOString}";
    it('works for a date', function(cb) {
      dustRender(dust, dottedPathTemplate , 'schemehelpers.toISOString', {myInput: new Date('1995-12-17T03:24:00')}, '1995-12-17T03:24:00.000Z', cb);
    });
    it('ignores everything else', function(cb) {
      dustRender(dust, dottedPathTemplate , 'schemehelpers.toISOString', {myInput: '51'}, '51', cb);
    });
  });

  describe('#sectionDisable', function() {
    it('works when enabled', function(cb) {
      var template = "{@sectionDisable section=\"edit\"}bro{:else}works{/sectionDisable}";
      dustRender(dust, template, 'schemehelpers.sectionDisable.edit', {section: 'edit'}, 'works', cb);
    });
    it('works when disabled', function(cb) {
      var template = "{@sectionDisable}works{:else}bro{/sectionDisable}";
      dustRender(dust, template, 'schemehelpers.sectionDisable.else', {section: 'index'}, 'works', cb);
    });
  });

  describe('#isNotHead', function() {
    it('works for for a non-head', function(cb) {
      var template = "{@isNotHead}works{:else}bro{/isNotHead}";
      dustRender(dust, template, 'schemehelpers.isNotHead.head', {curLogRev: {revisionId: '12345'}}, 'works', cb);
    });
    it('works', function(cb) {
      var template = "{@isNotHead}bro{:else}works{/isNotHead}";
      dustRender(dust, template, 'schemehelpers.isNotHead.else', {}, 'works', cb);
    });
  });

  describe('#isDraft', function() {
    it('works with a non-final Revision', function(cb) {
      var template = "{@isDraft}bro{:else}works{/isDraft}";
      dustRender(dust, template, 'schemehelpers.isDraft.head', {curLogRev: {revisionId: '12345', evtFinal: true}}, 'works', cb);
    });
    it('works with a final Revision', function(cb) {
      var template = "{@isDraft}works{:else}bro{/isDraft}";
      dustRender(dust, template, 'schemehelpers.isDraft.head', {curLogRev: {revisionId: '12345', evtFinal: false}}, 'works', cb);
    });
    it('works', function(cb) {
      var template = "{@isDraft}bro{:else}works{/isDraft}";
      dustRender(dust, template, 'schemehelpers.isDraft.else', {}, 'works', cb);
    });
  });

  describe('#linkIcon', function() {
    it('works for a svg', function(cb) {
      var template = "{@linkIcon/}";
      var context = {
        meta: {
          'rm3:icon': {
            sq: {
              svg: 'wow',
              alt: 'jog',
              height: 62,
              width: 66
            }
          }
        }
      };
      var text = '<link href="wow" rel="icon" /><media:thumbnail url="wow" height="62" width="66" xmlns:media="http://search.yahoo.com/mrss/" />';
      dustRender(dust, template, 'schemehelpers.linkIcon.svg', context, text, cb);
    });
    it('works for a png', function(cb) {
      var template = "{@linkIcon/}";
      var context = {
        meta: {
          'rm3:icon': {
            sq: {
              alt: 'jog',
              height: 62,
              width: 66
            }
          }
        }
      };
      var text = '<link href="jog" rel="icon" /><media:thumbnail url="jog" height="62" width="66" xmlns:media="http://search.yahoo.com/mrss/" />';
      dustRender(dust, template, 'schemehelpers.linkIcon.png', context, text, cb);
    });
    it('works for a different size', function(cb) {
      var template = "{@linkIcon size=\"tt\"/}";
      var context = {
        size: 'tt',
        meta: {
          'rm3:icon': {
            tt: {
              alt: 'jog',
              height: 62,
              width: 66
            }
          }
        }
      };
      var text = '<link href="jog" rel="icon" /><media:thumbnail url="jog" height="62" width="66" xmlns:media="http://search.yahoo.com/mrss/" />';
      dustRender(dust, template, 'schemehelpers.linkIcon.tt', context, text, cb);
    });
  });
  describe('#icon', function() {
    it('works for a svg', function(cb) {
      var template = "{@icon/}";
      var context = {
        meta: {
          'rm3:icon': {
            sq: {
              svg: 'wow',
              alt: 'jog',
              height: 62,
              width: 66
            }
          }
        }
      };
      var text = '<picture><source srcset="wow" type="image/svg+xml"><img srcset="jog"  height="62" width="66" border="0" /></picture>';
      dustRender(dust, template, 'schemehelpers.icon.svg', context, text, cb);
    });
    it('works for a png', function(cb) {
      var template = "{@icon/}";
      var context = {
        meta: {
          'rm3:icon': {
            sq: {
              alt: 'jog',
              height: 62,
              width: 66
            }
          }
        }
      };
      var text = '<img src="jog"  height="62" width="66" border="0" />';
      dustRender(dust, template, 'schemehelpers.icon.png', context, text, cb);
    });
    it('works for a different size', function(cb) {
      var template = "{@icon size=\"tt\"/}";
      var context = {
        size: 'tt',
        meta: {
          'rm3:icon': {
            tt: {
              alt: 'jog',
              height: 62,
              width: 66
            }
          }
        }
      };
      var text = '<img src="jog"  height="62" width="66" border="0" />';
      dustRender(dust, template, 'schemehelpers.icon.tt', context, text, cb);
    });
  });
});
