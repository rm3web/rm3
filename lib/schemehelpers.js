var SitePath = require ('sitepath');

/**
 * Install Dust helpers for sites
 * @param {*} dust Dust instance
 * @param {*} db Database instance
 * @param {*} query Query instance
 */
function installDust(dust, db, query) {
  dust.helpers.schemeStaticResource = function(chunk, context, bodies, params) {
    var scheme = context.get('scheme');
    var path = context.resolve(params.path);
    return chunk.write(scheme.getResourcePath(path));
  };

  dust.filters.toISOString = function(value) {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  };
}

exports.installDust = installDust;
