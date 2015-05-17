exports.entity_fields = function()
{ 
  var r = ['path', 'stub', 'hidden', '"entityId"', '"revisionId"', '"revisionNum"', 'proto',
       'modified','created','touched','summary','data','tags'];
  return r;
};

exports.log_fields = function()
{ 
  var r = ['path', '"entityId"', 'note', '"baseRevisionId"', '"replaceRevisionId"', '"revisionId"', 
      '"revisionNum"', '"evtStart"', '"evtEnd"', '"evtTouched"', '"evtClass"', '"evtFinal"', 'data'];
  return r;
};

exports.search_fields = function(s, fields) {
  fields.forEach(function(element, index, array) {
    s.field(element);
  });
  return s;
};

exports.set_fields = function(s, data) {
  for (var key in data) {
    if (data.hasOwnProperty(key)) {
      s.set(key, data[key]);
    }
  }
  return s; 
};