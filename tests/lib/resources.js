var user = require('../../lib/user');
var entity = require('../../lib/entity');
var db = require('../../lib/db');
var update = require('../../lib/update');

exports.entityResource = function entityResource(path, ents, entidx, provisional, now, func) {
  var ent = new entity.Entity();
  ent.createNew(path, 'base', now);
  ent.summary = {"title": entidx,
    "abstract": "some text goes here"};
  ent.data.posting = '<div></div>';
  ents[entidx] = ent;

  if (func) {
    func(ent);
  }

  before(function createEntityResource(done) {
    update.createEntity(db, {}, ent, true, 'create',
      function(err, entityId, revisionId, revisionNum) {
        ents[entidx]._entityId = entityId;
        ents[entidx]._revisionId = revisionId;
        ents[entidx]._revisionNum = revisionNum;
        done(err);
      });
  });

  after(function deleteEntityResource(done) {
    update.deleteEntity(db, {}, ent, true, 'delete', done);
    delete ents[entidx];
  });
};

exports.userResource = function userResource(userpath, username, ents, entidx, now) {
  var ent = new entity.Entity();

  user.createUser(ent, userpath, username, 'test', now);

  ent.summary.abstract = 'i like unicorns and sparkles and ponies.';

  ents[entidx] = ent;

  before(function encodePassword(done) {
    user.encodePassword('meow_kitty', ent, done);
  });

  before(function createUserResource(done) {
    update.createEntity(db, {}, ent, true, 'create',
      function(err, entityId, revisionId, revisionNum) {
        ents[entidx]._entityId = entityId;
        ents[entidx]._revisionId = revisionId;
        ents[entidx]._revisionNum = revisionNum;
        done(err);
      });
  });

  after(function deleteUserResource(done) {
    update.deleteEntity(db, {}, ent, true, 'delete', done);
    delete ents[entidx];
  });
};

exports.permissionResource = function permissionResource(role, permission, path) {
  before(function createPermissionResource(done) {
    update.addPermissionToRole(db, {}, role, permission, path, "note", done);
  });

  after(function deletePermissionResource(done) {
    update.removePermissionFromRole(db, {}, role, permission, path, "note", done);
  });
};

exports.assignmentResource = function assignmentResource(userpath, username, role) {
  before(function createAssignmentResource(done) {
    var path = userpath.down(username);
    update.assignUserToRole(db, {}, path, role, 'note', done);
  });

  after(function deleteAssignmentResource(done) {
    var path = userpath.down(username);
    update.removeUserFromRole(db, {}, path, role, 'note', done);
  });
};
