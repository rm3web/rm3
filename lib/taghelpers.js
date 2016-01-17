/**
 * Install Dust helpers for the Activity feed.
 * @param {*} dust Dust instance
 * @param {*} db Database instance
 * @param {*} query Query instance
 */
function installDust(dust, db, query) {
  dust.helpers.predTag = function(chunk, context, bodies, params) {
    var obj = context.get('obj');
    var predKey = context.get('predKey');
    if (obj.objClass === 'tag' && predKey === 'plain') {
      chunk.write('');
    } else {
      chunk.write(predKey + ":" + obj.objClass);
    }
  };

  dust.helpers.objLink = function(chunk, context, bodies, params) {
    var obj = context.get('obj');
    var predKey = context.get('predKey');
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
