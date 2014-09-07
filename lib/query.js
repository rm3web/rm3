var sitepath = require ('./sitepath');
var entity = require ('./entity');
var db = require('./db');

select_query = "SELECT path, stub, entity_id, revision_id, revision_num, \
proto, modified, created, summary, data FROM wh_entity WHERE path = $1;";

exports.entity_from_path = function(path, next) {
  db.connect_wrap(function(client, done) {
    var select = client.query({
      text: select_query,
      values: [path.toDottedPath()],
      name: 'select_query'
    }, function(err, result) {
      done();
      if(err) {
        console.error('error running query', err);
        next(err);
      }
      e = new entity.Entity();
      e.from_db(result);
      next(null,e);
    });
  });
};