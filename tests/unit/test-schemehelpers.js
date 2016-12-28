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

      dustRender(dust, siteTemplate , 'sitehelpers.schemeStaticResource', {scheme: scheme}, 'loafPath', cb);
    });
  });

  describe('#toISOString', function() {
    var dottedPathTemplate = "{myInput|toISOString}";
    it('works for a date', function(cb) {
      dustRender(dust, dottedPathTemplate , 'sitehelpers.toISOString', {myInput: new Date('1995-12-17T03:24:00')}, '1995-12-17T03:24:00.000Z', cb);
    });
    it('ignores everything else', function(cb) {
      dustRender(dust, dottedPathTemplate , 'sitehelpers.toISOString', {myInput: '51'}, '51', cb);
    });
  });
});
