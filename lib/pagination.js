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

exports.generatePagination = generatePagination;
exports.parsePath = parsePath;
