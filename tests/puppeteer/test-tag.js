var should = require('chai').should();
var puppeteer = require('puppeteer');
require('mocha-steps');

describe('tags', function() {
  var browser = {};

  before(async function () {
    browser = await puppeteer.launch({headless: true});
  });

  describe('should CRUD', function() {
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

    step("should get to the add tags form and add tags", async () => { 
      await Promise.all([
        page.waitForNavigation( { waitUntil: 'networkidle2' }),
        page.click('a[href*=tag]'),
      ]);

      //(await page.$('div.footer')).ok;
      //(await page.$('div.r-ss-wrap')).ok;
      //(await page.$('#tagaddform > div.pure-g > div.pure-u-1-2')).ok;
      //(await page.$('#tagaddform > div.pure-g > div.pure-u-1-2 > div')).ok;

      //await page.type('input[type="text"]', 'ponies');

      //await page.click('span.carat.down');

      //await page.click('li[data-option-value="plain"]');

      //await page.click('#tagaddform > div > div > div > button');
      /*/
      await Promise.all([
        page.waitForNavigation( { waitUntil: 'networkidle2' }),
        await page.click('#tagaddform > button.pure-button-primary'),
      ]);
        */
    });

/*
    casper.thenOpen('http://127.0.0.1:4000/', function() {
      'div.footer'.should.be.inDOM.and.be.visible;
      'div.footer'.should.contain.text('ponies');
      'div.pure-u-2-3'.should.contain.text('Welcome to rm3');
    });

    casper.thenOpen('http://127.0.0.1:4000/search.cgi/$/tag/plain/ponies', function() {
      'div.footer'.should.be.inDOM.and.be.visible;
      'body > div.pure-g > div.pure-u-2-3'.should.contain.text('Welcome to rm3');
      this.click('a[href*=logout]');
    });
*/
  });
  after(function() {
    return browser.close();
  });
});
