var SitePath = require ('./sitepath');
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
}

exports.installDust = installDust;
