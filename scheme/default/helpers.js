var Protoset = require('../../lib/protoset');
var ActivityFeed = require('../../lib/activityfeed');
var IndexFeed = require('../../lib/indexfeed');
var TagHelpers = require('../../lib/taghelpers');
var TextblockHelpers = require('../../lib/textblockhelpers');
var SiteHelpers = require('../../lib/sitehelpers');
var SchemeHelpers = require('../../lib/schemehelpers');
var AuthorizeHelpers = require('../../lib/authorizehelpers');
var ReactHelpers = require('../../lib/reacthelpers');
var imageScale = require('../../lib/imagescale');

exports = module.exports = function(dust, db, cache, query, reactDir) {

  ActivityFeed.installDust(dust, db, query);
  IndexFeed.installDust(dust, db, cache, query);
  TagHelpers.installDust(dust, db, query);
  TextblockHelpers.installDust(dust, db, query);
  SiteHelpers.installDust(dust, db, query);
  SchemeHelpers.installDust(dust, db, query);
  ReactHelpers.installDust(dust, db, query, reactDir);
  AuthorizeHelpers.installDust(dust, db, query);

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
