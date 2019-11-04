var should = require('chai').should();
var puppeteer = require('puppeteer');
require('mocha-steps');

describe('history', function() {
  var browser = {};

  before(async function () {
    browser = await puppeteer.launch({headless: true});
  });

  describe('should work', function() {
    var page = {};
    
    before (async () => {
      page = await browser.newPage();
      await page.goto('http://127.0.0.1:4000/', { waitUntil: 'networkidle2' });
    });

    step("should have a link", async () => {
      (await page.title()).should.eql('Welcome to rm3');
      (await page.$('a[href*=history]')).ok;
      (await page.$('div.footer')).ok;

      const contentext = await ( await ( await page.$( 'body > div.pure-g > div.pure-u-2-3 > h1' ) ).getProperty( 'innerHTML' ) ).jsonValue();
      contentext.should.contain('Welcome to rm');

      await Promise.all([
        page.waitForNavigation( { waitUntil: 'networkidle2' }),
        page.click('a[href*=history]'),
      ]);
    });

    step("should be viewable", async () => {
      (await page.title()).should.eql('Welcome to rm3');
      (await page.$('div.footer')).ok;

      const contentext = await ( await ( await page.$( 'div.pure-u-2-3 > h1' ) ).getProperty( 'innerHTML' ) ).jsonValue();
      contentext.should.contain('History');

      const contentext2 = await ( await ( await page.$( 'div.pure-u-2-3 > ul > li' ) ).getProperty( 'innerHTML' ) ).jsonValue();
      contentext2.should.contain('Create');
    });    
  });
  after(function() {
    return browser.close();
  });
});
