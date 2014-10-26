exports.entity_fields = ['path', 'stub', 'hidden', 'entity_id', 'revision_id', 'revision_num',
                         'proto','modified','created','touched','summary','data','tags'];

exports.log_fields = ['path', 'entity_id', 'note', 'base_revision_id', 'replace_revision_id',
                      'revision_id', 'revision_num', 'evt_start', 'evt_end', 'evt_touched',
                      'evt_class', 'evt_final', 'data'];

exports.search_fields = function(s, fields) {
  fields.forEach(function(element, index, array) {
    s.field(element);
  });
  return s;
}

exports.set_fields = function(s, data) {
  for (var key in data) {
    if (data.hasOwnProperty(key)) {
      s.set(key, data[key]);
    }
  }
  return s; 
}