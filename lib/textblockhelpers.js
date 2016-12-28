var textblocks = require('textblocks');

/**
 * Install Dust helpers for schemes
 * @param {*} dust Dust instance
 * @param {*} db Database instance
 * @param {*} query Query instance
 */
function installDust(dust, db, query) {
  dust.helpers.textblock = function(chunk, context, bodies, params) {
    var textblock = context.resolve(params.field);
    var resolve = context.resolve(params.resolve);
    var ctx = context.get('ctx');
    var sitepath = context.get('path');
    var scheme = context.get('scheme');
    var site = context.get('site');
    var protoset = context.get('protoset');
    var security = context.get('security');
    var blobstores = context.get('blobstores');
    var state_ctx = {
      ctx: ctx,
      db: db,
      sitepath: sitepath,
      scheme: scheme,
      site: site,
      protoset: protoset,
      access: security,
      blobstores: blobstores
    };
    if (textblock) {
      return chunk.map(function(chunk) {
        textblocks.outputTextBlock(textblock, resolve, state_ctx ,function(err, output) {
          chunk.write(output);
          return chunk.end();
        });
      });
    } else {
      return chunk.end();
    }
  };
}

exports.installDust = installDust;
