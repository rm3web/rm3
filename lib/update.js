var sitepath = require ('./sitepath');
var entity = require ('./entity');
var db = require('./db')
var uuid = require('node-uuid')

insert_query = "INSERT INTO wh_entity (path, stub, entity_id, revision_id, \
revision_num, proto, modified, created, summary, data) VALUES ($1, $2, \
$3, $4, $5, $6, $7, $8, $9, $10);"

exports.create_entity = function(entity, next) {
  db.connect_wrap(function(client, done) {
    var view = entity.view()
    var insert = client.query({
      text: insert_query,
      values: [entity._path.toDottedPath(), false, uuid.v1(), uuid.v1(), 1,
               entity._proto, new Date(), new Date(), entity.summary, entity.data],
      name: 'insert_query'
    }, function(err, result) {
      if(err) {
        console.error('error running query', err);
      }
      done()
      next()
    });
  });
}

exports.update_entity = function(entity, next) {

}