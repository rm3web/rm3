var should = require('chai').should();
var puppeteer = require('puppeteer');
require('mocha-steps');

describe('pre-created types', function() {
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

    step("should have the title", async () => {

      (await page.title()).should.eql('Welcome to rm3');
      (await page.$('a[href*=login]')).ok;
      (await page.$('div.footer')).ok;

      await Promise.all([
        page.waitForNavigation( { waitUntil: 'networkidle2' }),
        page.click('a[href*=login]'),
      ]);

      (await page.$('form[action*=login]')).ok;
      (await page.$('div.footer')).ok;
    });

    step("should log in", async () => {

      //const inner_html = await ( await ( await page.$( 'form[action*=login]' ) ).getProperty( 'innerHTML' ) ).jsonValue();
      //console.log( inner_html );

      await page.type('input[name=username]', 'wirehead');
      await page.type('input[name=password]', 'password');

      await Promise.all([
        page.waitForNavigation( { waitUntil: 'networkidle2' }),
        page.$eval('form[action*=login]', form => form.submit())
      ]);

      (await page.$('a[href*=logout]')).ok;
      (await page.$('div.footer')).ok;

      const infomessage = await ( await ( await page.$( 'div.infomessage' ) ).getProperty( 'innerHTML' ) ).jsonValue();
      infomessage.should.equal('You have been logged in')
    });

    step("plain page type should render", async () => {
      await page.goto('http://127.0.0.1:4000/users/', { waitUntil: 'networkidle2' });

      (await page.$('a[href*=wirehead]')).ok;
      (await page.$('div.footer')).ok;

      const contentext = await ( await ( await page.$( 'div.pure-u-2-3' ) ).getProperty( 'innerHTML' ) ).jsonValue();
      contentext.should.contain('Users go here...');
      await Promise.all([
        page.waitForNavigation( { waitUntil: 'networkidle2' }),
        page.click('a[href*=wirehead]'),
      ]);

    });

    step("users page type should render", async () => {
      page.url().should.equal("http://127.0.0.1:4000/users/wirehead/");

      (await page.$('a[href*=wirehead]')).ok;
      (await page.$('div.footer')).ok;
      (await page.$('a[href*=logout]')).ok;

      const contentext = await ( await ( await page.$( 'div.pure-u-1-3' ) ).getProperty( 'innerHTML' ) ).jsonValue();
      contentext.should.contain('Some profile text');
    });

    step("blog + comment page should render", async () => {
      await page.goto('http://127.0.0.1:4000/blog/', { waitUntil: 'networkidle2' });

      (await page.$('div.footer')).ok;

      const contentext = await ( await ( await page.$( 'div.pure-u-2-3' ) ).getProperty( 'innerHTML' ) ).jsonValue();
      contentext.should.contain('Blog stuff here...');
      contentext.should.contain('Comment goes here');
    });

    step("blog + comment page should render", async () => {
      await page.goto('http://127.0.0.1:4000/link/', { waitUntil: 'networkidle2' });

      (await page.$('a[href*=example]')).ok;
      (await page.$('div.footer')).ok;

      const contentext = await ( await ( await page.$( 'div.pure-u-2-3' ) ).getProperty( 'innerHTML' ) ).jsonValue();
      contentext.should.contain('Test link');

      const contentext2 = await ( await ( await page.$( 'div.pure-u-2-3 a' ) ).getProperty( 'innerHTML' ) ).jsonValue();
      contentext2.should.contain('Link');
    });

  });
  after(function() {
    return browser.close();
  });
});
