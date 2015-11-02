var events = require("events");
/*
 * Add `$idx` paramaters to the response.
 */
function addIdx(response) {
  var ee = new events.EventEmitter();
  var idx = 0;
  response.on('error', function(err) {
    ee.emit('error', err);
  });
  response.on('article', function(article) {
    article.$idx = idx;
    ee.emit('article', article);
    idx = idx + 1;
  });
  response.on('end', function() {
    ee.emit('end');
  });

  return ee;
}

exports.addIdx = addIdx;
