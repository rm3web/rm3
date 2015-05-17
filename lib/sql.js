exports.entityFields = function() {
  var r = ['path', 'stub', 'hidden', '"entityId"', '"revisionId"', '"revisionNum"',
    'proto', 'modified', 'created', 'touched', 'summary', 'data', 'tags'];
  return r;
};

exports.logFields = function() {
  var r = ['path', '"entityId"', 'note', '"baseRevisionId"', '"replaceRevisionId"',
      '"revisionId"', '"revisionNum"', '"evtStart"', '"evtEnd"', '"evtTouched"',
      '"evtClass"', '"evtFinal"', 'data'];
  return r;
};

exports.searchFields = function(s, fields) {
  fields.forEach(function(element, index, array) {
    s.field(element);
  });
  return s;
};

exports.setFields = function(s, data) {
  for (var key in data) {
    if (data.hasOwnProperty(key)) {
      s.set(key, data[key]);
    }
  }
  return s;
};
