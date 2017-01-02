var imageScale = require('../../lib/imagescale');

exports = module.exports = function(dust, db, cache, query, reactDir) {
  dust.helpers.thumbnail = function(chunk, context, bodies, params) {
    var size = context.resolve(params.size);
    var svgicon = context.get('meta.rm3\:svg');
    var imgicon = context.get('meta.rm3\:srcset');
    var sizes = context.get('meta.rm3\:sizes');
    var scaleSize = imageScale.scaleBestFit(sizes.width, sizes.height, size);
    if (svgicon) {
      return chunk.write('<picture><source srcset="' + svgicon +
                '" type="image/svg+xml"><img srcset="' + imgicon +
                '"  height="' + scaleSize.height + '" width="' +
                scaleSize.width + '" border="0" data-width="' +
                scaleSize.width + '" data-height="' + scaleSize.height + '"/></picture>');
    } else {
      return chunk.write('<img srcset="' + imgicon + '"  height="' + scaleSize.height +
                '" width="' + scaleSize.width + '" border="0" data-width="' +
                scaleSize.width + '" data-height="' + scaleSize.height + '"/>');
    }
  };

};
