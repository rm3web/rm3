var should = require('chai').should();
var puppeteer = require('puppeteer');
require('mocha-steps');

describe('base crud', function() {
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

    step("should create a base proto", async () => {    
      await page.click('#protomenu .pure-button');

      await Promise.all([
        page.waitForNavigation( { waitUntil: 'networkidle2' }),
        page.click('#PROTO_BASE'),
      ]);

      (await page.$('div.footer')).ok;

      await page.type('textarea[name=title]', 'CasperJS Test');
      await page.type('textarea[name=posting\\[source\\]]', 'post data here do stuff etc');

      await Promise.all([
        page.waitForNavigation( { waitUntil: 'networkidle2' }),
        page.$eval('form[action*=create]', form => form.submit())
      ]);

      (await page.$('div.footer')).ok;
    });

    step("should update a base proto", async () => { 

      const contentext = await ( await ( await page.$( 'div.pure-u-2-3' ) ).getProperty( 'innerHTML' ) ).jsonValue();
      contentext.should.equal('post data here do stuff etc')

      await Promise.all([
        page.waitForNavigation( { waitUntil: 'networkidle2' }),
        page.click('a[href*=edit]'),
      ]);

      (await page.$('div.footer')).ok;
      (await page.$('textarea[name=posting\\[source\\]]')).ok;

      (await page.click('#addText'));

      await page.type('textarea[name=title]', 'CasperJS Test');
      await page.type('textarea[name=posting\\[blocks\\]\\[0\\]\\[source\\]]', '# edited\n\ndid some stuff');
      await page.select('select[name=posting\\[blocks\\]\\[0\\]\\[format\\]]', 'markdown');
      await page.type('textarea[name=posting\\[blocks\\]\\[1\\]\\[source\\]]', '<strong>html stuff</strong>');
      await page.select('select[name=posting\\[blocks\\]\\[1\\]\\[format\\]]', 'html');

      await Promise.all([
        page.waitForNavigation( { waitUntil: 'networkidle2' }),
        page.click('button[type=submit]'),
      ]);

      (await page.$('div.footer')).ok;

      const page_html = await ( await ( await page.$( 'div.pure-u-2-3' ) ).getProperty( 'innerHTML' ) ).jsonValue();
      page_html.should.equal('<h1>edited</h1>\n<p>did some stuffpost data here do stuff etc</p>\n<strong>html stuff</strong>');

    });
    step("should delete a proto", async () => { 

      await page.click('#gearmenu .pure-button');
      await page.click('#DELETE');

      await Promise.all([
        page.waitForNavigation( { waitUntil: 'networkidle2' }),
        page.click('div.ReactModalPortal a.pure-button'),
      ]);

      const infodeletemessage = await ( await ( await page.$( 'div.infomessage' ) ).getProperty( 'innerHTML' ) ).jsonValue();
      infodeletemessage.should.equal('Page deleted')
    });

  });
  after(function() {
    return browser.close();
  });
});
