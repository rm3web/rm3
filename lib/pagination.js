var events = require("events");

function generatePagination(paginationLimit) {
  var pagination = {};

  if (paginationLimit) {
    pagination.limit = parseInt(paginationLimit, 10) + 1;
    pagination.start = 0;
  }
  return pagination;
}

function parsePath(pagination, paginationKey, partial, tupleparse) {
  if (partial) {
    var partialKeyStart = partial.indexOf(paginationKey);
    if (partialKeyStart !== -1) {
      var memento = partial[partialKeyStart + 1].split('_');
      if (memento.length > 0) {
        pagination.start = parseInt(memento[0],10);
      }
      tupleparse(pagination, memento);
    }
  }
}

function generatePageLink(paginationKey, pagination, memento) {
  return paginationKey + '/' + (pagination.start + pagination.limit - 1) + "_" +
    memento.join('_');
}

function generateLastLink(resp, pagination) {
  var ee = new events.EventEmitter();
  var idx = 0;
  var lastArt = {};
  var more = false;
  resp.on('article', function(article) {
    if (idx + 1 === pagination.limit) {
      more = true;
    } else {
      ee.emit('article', article);
      idx = idx + 1;
      lastArt = article;
    }
  });
  resp.on('error', function(err) {
    ee.emit('error', err);
  });
  resp.on('end', function() {
    if (more) {
      ee.emit('more', lastArt);
    } else {
      ee.emit('more', undefined);
    }
    ee.emit('end');
  });
  return ee;

}

exports.generatePagination = generatePagination;
exports.parsePath = parsePath;
exports.generatePageLink = generatePageLink;
exports.generateLastLink = generateLastLink;
