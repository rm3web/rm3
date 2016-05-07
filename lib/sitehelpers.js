var Conf = require('./conf'),
    SitePath = require ('sitepath');
/**
 * Install Dust helpers for sites
 * @param {*} dust Dust instance
 * @param {*} db Database instance
 * @param {*} query Query instance
 */
function installDust(dust, db, query) {
  dust.helpers.sitePathToUrl = function(chunk, context, bodies, params) {
    var site = context.get('site');
    var path = context.resolve(params.path);
    if (path instanceof SitePath) {
      chunk.write(site.sitePathToUrl(path));
    } else {
      chunk.write(path);
    }
  };

  dust.helpers.hasAuthProviderEnabled = function(chunk, context, bodies, params) {
    var enabled = false;
    var twitterConsumerKey = Conf.getCertificate('twitterConsumerKey');
    var provider = context.resolve(params.provider);
    if (provider === 'twitter') {
      if (twitterConsumerKey) {
        enabled = true;
      }
    }
    if (enabled) {
      return chunk.render(bodies.block, context);
    } else {
      if (bodies.else) {
        return chunk.render(bodies.else, context);
      }
    }
  };
}

exports.installDust = installDust;
