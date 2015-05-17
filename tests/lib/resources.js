var user = require('../../lib/user');
var entity = require('../../lib/entity');
var db = require('../../lib/db');
var update = require('../../lib/update');

exports.entity_resource = function entity_resource(path, ents, entidx, provisional, now, func) {
  var ent = new entity.Entity();
  ent.createNew(path, 'base', now);
  ent.summary = {"title": entidx,
    "abstract": "some text goes here"};
  ent.data.posting = '<div></div>';
  ents[entidx] = ent;

  if(func) {
    func(ent);
  }

  before(function create_entity_resource(done) {
    update.create_entity(db, ent, true, 'create', 
      function(err, entityId, revisionId, revisionNum) {
        ents[entidx]._entityId = entityId;
        ents[entidx]._revisionId = revisionId;
        ents[entidx]._revisionNum = revisionNum;
        done(err);
    });
  });

  after(function delete_entity_resource(done) {
    update.delete_entity(db, ent, true, 'delete', done);
    delete ents[entidx];
  });
};

exports.user_resource = function user_resource(userpath, username, ents, entidx, now) {
  var ent = new entity.Entity();

  user.createUser(ent, userpath, username, 'test', now);

  ent.summary.abstract = 'i like unicorns and sparkles and ponies.';
  
  ents[entidx] = ent;

  before(function encode_password(done) {
    user.encodePassword('meow_kitty', ent, done);
  });

  before(function create_entity_resource(done) {
    update.create_entity(db, ent, true, 'create', 
      function(err, entityId, revisionId, revisionNum) {
        ents[entidx]._entityId = entityId;
        ents[entidx]._revisionId = revisionId;
        ents[entidx]._revisionNum = revisionNum;
        done(err);
    });
  });

  after(function delete_entity_resource(done) {
    update.delete_entity(db, ent, true, 'delete', done);
    delete ents[entidx];
  });
};

exports.permission_resource = function permission_resource(role, permission, path) {
  before(function create_permission_resource(done) {
    update.add_permission_to_role(db, role, permission, path, "note", done);
  });

  after(function delete_permission_resource(done) {
    update.remove_permission_from_role(db, role, permission, path, "note", done);
  });
};

exports.assignment_resource = function assignment_resource(userpath, username, role) {
  before(function create_assignment_resource(done) {
    var path = userpath.down(username);
    update.assign_user_to_role(db, path, role, 'note', done);
  });

  after(function delete_assignment_resource(done) {
    var path = userpath.down(username);
    update.remove_user_from_role(db, path, role, 'note', done);
  });
};