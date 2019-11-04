var should = require('chai').should();
var puppeteer = require('puppeteer');
require('mocha-steps');

describe('oauth', function() {
  var browser = {};

  before(async function () {
    browser = await puppeteer.launch({headless: true});
  });

  describe('should log in and out', function() {
    var page = {};

    before (async () => {
      page = await browser.newPage();
      await page.goto('http://127.0.0.1:9000/', { waitUntil: 'networkidle2' });
    });

    step("should start the auth process", async () => {

      (await page.$('a[href*=auth]')).ok;
      await Promise.all([
        page.waitForNavigation( { waitUntil: 'networkidle2' }),
        page.click('a[href*=auth]'),
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

      await Promise.all([
        page.waitForNavigation( { waitUntil: 'networkidle2' }),
        page.click('a[href*=logout]'),
      ]);
    });

    step("should be logged out", async () => {

      (await page.title()).should.eql('Welcome to rm3');
      (await page.$('a[href*=login]')).ok;
      (await page.$('div.footer')).ok;
    });

  });


  after(function() {
    return browser.close();
  });
});
