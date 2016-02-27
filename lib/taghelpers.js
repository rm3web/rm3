/**
 * Install Dust helpers for the Activity feed.
 * @param {*} dust Dust instance
 * @param {*} db Database instance
 * @param {*} query Query instance
 */
function installDust(dust, db, query) {

  dust.helpers.tags = function (chunk, context, bodies, params) {
    return chunk.map(function(chunk) {
      var tags = context.resolve(params.obj);
      var showNav = context.resolve(params.showNav);
      tags.iterateTags(function(pred, obj, idx) {
        var render = true;
        if (showNav) {
          if (pred === 'navigation') {
              render = false;
          }
        }
        if (render) {
          chunk.render(bodies.block, context.push( 
              {objKey: obj['@id'],
               pred: pred,
               obj: obj}));
        }
      })
      chunk.end();
    })
  }

  dust.helpers.predTag = function(chunk, context, bodies, params) {
    var pred = context.get('pred');
    chunk.write(pred);
  };

  dust.helpers.objLink = function(chunk, context, bodies, params) {
    var obj = context.get('obj');
    var predKey = context.get('pred');
    var objKey = context.get('objKey');
    var linkclass = context.resolve(params.linkclass);
    var rel = "";
    if (linkclass) {
      rel = rel + 'class = "' + linkclass + '" ';
    }
    if (obj.objClass === 'tag' && predKey === 'plain') {
      chunk.write('<a ' + rel + 'href="/tags.html/$/' + objKey + '">' + objKey +
          "</a>");
    } else {
      chunk.write(objKey);
    }
  };
}

exports.installDust = installDust;
