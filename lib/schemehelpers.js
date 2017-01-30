var SitePath = require ('sitepath');

/**
 * Install Dust helpers for schemes
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

  dust.helpers.sectionDisable = function(chunk, context, bodies, params) {
    var disabled = false;
    var sectionDisable = context.resolve(params.section);
    if (sectionDisable && context.get('section') === sectionDisable) {
      disabled = true;
    }
    if (disabled) {
      if (bodies.else) {
        return chunk.render(bodies.else, context);
      }
    } else {
      return chunk.render(bodies.block, context);
    }
  };

  dust.helpers.isNotHead = function(chunk, context, bodies, params) {
    var curLogRev = context.get('curLogRev.revisionId');
    if (curLogRev) {
      return chunk.render(bodies.block, context);
    } else {
      return chunk.render(bodies.else, context);
    }
  };

  dust.helpers.isDraft = function(chunk, context, bodies, params) {
    var curLogRev = context.get('curLogRev');
    if (curLogRev) {
      if (curLogRev.evtFinal) {
        return chunk.render(bodies.else, context);
      } else {
        return chunk.render(bodies.block, context);
      }
    }
  };

  dust.helpers.linkIcon = function(chunk, context, bodies, params) {
    var size = context.resolve(params.size);
    if (!size) {
      size = 'sq';
    }
    var svgicon = context.get('meta.rm3:icon.' + size + '.svg');
    var imgicon = context.get('meta.rm3:icon.' + size + '.alt');
    var height = context.get('meta.rm3:icon.' + size + '.height');
    var width = context.get('meta.rm3:icon.' + size + '.width');
    if (svgicon) {
      return chunk.write('<link href="' + svgicon + '" rel="icon" />' +
                '<media:thumbnail url="' + svgicon + '" height="' + height +
                '" width="' + width + '" xmlns:media="http://search.yahoo.com/mrss/" />'
                );
    } else {
      return chunk.write('<link href="' + imgicon + '" rel="icon" />' +
                '<media:thumbnail url="' + imgicon + '" height="' + height +
                '" width="' + width + '" xmlns:media="http://search.yahoo.com/mrss/" />'
                );
    }
  };

  dust.helpers.icon = function(chunk, context, bodies, params) {
    var size = context.resolve(params.size);
    if (!size) {
      size = 'sq';
    }
    var svgicon = context.get('meta.rm3:icon.' + size + '.svg');
    var imgicon = context.get('meta.rm3:icon.' + size + '.alt');
    var height = context.get('meta.rm3:icon.' + size + '.height');
    var width = context.get('meta.rm3:icon.' + size + '.width');
    if (svgicon) {
      return chunk.write('<picture><source srcset="' + svgicon +
                '" type="image/svg+xml"><img srcset="' + imgicon +
                '"  height="' + height + '" width="' + width + '" border="0" /></picture>');
    } else {
      return chunk.write('<img src="' + imgicon + '"  height="' + height +
                '" width="' + width + '" border="0" />');
    }
  };
}

exports.installDust = installDust;
