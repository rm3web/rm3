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

  before(function createEntity_resource(done) {
    update.createEntity(db, ent, true, 'create', 
      function(err, entityId, revisionId, revisionNum) {
        ents[entidx]._entityId = entityId;
        ents[entidx]._revisionId = revisionId;
        ents[entidx]._revisionNum = revisionNum;
        done(err);
    });
  });

  after(function deleteEntity_resource(done) {
    update.deleteEntity(db, ent, true, 'delete', done);
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

  before(function createEntity_resource(done) {
    update.createEntity(db, ent, true, 'create', 
      function(err, entityId, revisionId, revisionNum) {
        ents[entidx]._entityId = entityId;
        ents[entidx]._revisionId = revisionId;
        ents[entidx]._revisionNum = revisionNum;
        done(err);
    });
  });

  after(function deleteEntity_resource(done) {
    update.deleteEntity(db, ent, true, 'delete', done);
    delete ents[entidx];
  });
};

exports.permission_resource = function permission_resource(role, permission, path) {
  before(function create_permission_resource(done) {
    update.addPermissionToRole(db, role, permission, path, "note", done);
  });

  after(function delete_permission_resource(done) {
    update.removePermissionFromRole(db, role, permission, path, "note", done);
  });
};

exports.assignment_resource = function assignment_resource(userpath, username, role) {
  before(function create_assignment_resource(done) {
    var path = userpath.down(username);
    update.assignUserToRole(db, path, role, 'note', done);
  });

  after(function delete_assignment_resource(done) {
    var path = userpath.down(username);
    update.removeUserFromRole(db, path, role, 'note', done);
  });
};