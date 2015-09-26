/**
 * Install Dust helpers for the Activity feed.
 * @param {*} dust Dust instance
 * @param {*} db Database instance
 * @param {*} query Query instance
 */
function installDust(dust, db, query) {
  dust.helpers.predTag = function(chunk, context, bodies, params) {
    var predClass = context.get('predClass');
    var predKey = context.get('predKey');
    if (predClass === 'tag' && predKey === 'plain') {
      chunk.write('');
    } else {
      chunk.write(predKey + ":" + predClass);
    }
  };

  dust.helpers.objLink = function(chunk, context, bodies, params) {
    var predClass = context.get('predClass');
    var predKey = context.get('predKey');
    var objKey = context.get('objKey');
    var linkclass = context.resolve(params.linkclass);
    var rel = "";
    if (linkclass) {
      rel = rel + 'class = "' + linkclass + '" ';
    }
    if (predClass === 'tag' && predKey === 'plain') {
      chunk.write('<a ' + rel + 'href="/tags.html/$/' + objKey + '">' + objKey +
          "</a>");
    } else {
      chunk.write(objKey);
    }
  };
}

exports.installDust = installDust;
