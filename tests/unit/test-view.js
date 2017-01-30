var view = require ('../../lib/view');
var textblocks = require('textblocks');
var SitePath = require ('sitepath');
var should = require('chai').should();

describe('view', function() {
  describe('enhancement', function() {
    it('should work as expected', function() {
      var site = {};
      site.root = new SitePath('wh');
      var posting = '![Image](/qwe){data-size=medium data-float=left data-title=title data-desc=description}';
      var block = textblocks.makeTextBlock(posting, 'markdown', {site: site});
      block.htmlslabs.should.eql(['<p>',
        {src: '/qwe',
          alt: 'Image',
          'data-size': 'medium',
          'data-float': 'left',
          'data-title': 'title',
          'data-desc': 'description',
          sitepath: 'wh.qwe',
          name: 'siteImage'},
        '</p>\n']);
      block.source.should.equal(posting);
    });
  });
});
