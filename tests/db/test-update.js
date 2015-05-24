var Conf = require ('../../lib/conf');
var entity = require('../../lib/entity');
var sitepath = require ('../../lib/sitepath');
var async = require('async');
var uuid = require('node-uuid');
var update = require('../../lib/update');
var db = require('../../lib/db');
var should = require('should');
require('mocha-steps');

function quickQuery(db, querytext, next) {
  async.waterfall([
    db.connectWrap,
    function(client, done, callback) {
      client.query(querytext, function(err, result) {
        done(err);
        callback(err, result);
      });
    }
  ], next);
}

function stepGenericCreate(desc, path, ents, entidx, provisional, now) {
  ents[entidx] = new entity.Entity();
  step(desc, function(done) {
    var longstr = '<div></div>';
    ents[entidx].createNew(path, 'base', now);
    ents[entidx].summary = {"title": "blrg",
      "abstract": "some text goes here"};
    ents[entidx].data.posting = longstr;
    ents[entidx].addTag('navigation', 'navbar');

    update.createEntity(db, {}, ents[entidx], provisional, 'create',
      function(err, entityId, revisionId, revisionNum) {
        should.not.exist(err);
        should.exist(entityId);
        entityId.should.be.an.instanceof(String);
        revisionId.should.be.an.instanceof(String);
        revisionNum.should.be.an.instanceof(Number);
        ents[entidx]._entityId = entityId;
        ents[entidx]._revisionId = revisionId;
        ents[entidx]._revisionNum = revisionNum;
        done(err);
      });
  });
}

function stepGenericUpdate(desc, ents, startidx, nextidx) {
  ents[nextidx] = ents[startidx].clone();
  ents[nextidx].data.posting = "<div>blah blah blah</div>";
  step(desc, function(done) {
    update.updateEntity(db, {}, ents[startidx], ents[nextidx], true, 'update',
      function(err, entityId, revisionId, revisionNum) {
        should.not.exist(err);
        should.exist(entityId);
        entityId.should.be.an.instanceof(String);
        revisionId.should.be.an.instanceof(String);
        revisionNum.should.be.an.instanceof(Number);
        ents[nextidx]._entityId = entityId;
        ents[nextidx]._revisionId = revisionId;
        ents[nextidx]._revisionNum = revisionNum;
        done(err);
      });
  });
}

function stepGenericMove(desc, ents, startidx, newpath, moveMark) {
  step(desc, function(done) {
    update.moveEntity(db, {}, ents[startidx], newpath, true, 'move',
      function(err, entityId, revisionId, revisionNum) {
        should.not.exist(err);
        should.exist(entityId);
        entityId.should.be.an.instanceof(String);
        revisionId.should.be.an.instanceof(String);
        revisionNum.should.be.an.instanceof(Number);
        moveMark.revisionId = revisionId;
        moveMark.revisionNum = revisionNum;
        done(err);
      });
  });
}

function stepGenericDelete(desc, ent, delMark) {
  step(desc, function(done) {
    update.deleteEntity(db, {}, ent, true, 'delete',
      function(err, entityId, revisionId, revisionNum) {
        should.not.exist(err);
        should.exist(entityId);
        entityId.should.be.an.instanceof(String);
        entityId.should.equal(ent._entityId);
        revisionId.should.be.an.instanceof(String);
        revisionNum.should.be.an.instanceof(Number);
        delMark.revisionId = revisionId;
        delMark.revisionNum = revisionNum;
        done(err);
      });
  });
}

function stepValidatePermissionExistence(desc, path) {
  step(desc, function(done) {
    var query = "SELECT role, permission, path FROM wh_permission_to_role WHERE path = '" +
      path + "'";
    quickQuery(db, query, function(err, result) {
      should.not.exist(err);
      result.rows[0].role.should.equal('role');
      result.rows[0].permission.should.equal('permission');
      result.rows[0].path.should.equal(path);
      done(err);
    });
  });
}

function stepValidatePermissionNonExistence(desc, path) {
  step(desc, function(done) {
    var query = "SELECT role, permission, path FROM wh_permission_to_role WHERE path = '" +
      path + "'";
    quickQuery(db, query, function(err, result) {
      should.not.exist(err);
      should.deepEqual(result.rowCount, 0);
      done(err);
    });
  });
}

function stepValidateEntityExistence(desc, ent) {
  step(desc, function(done) {
    var query = "SELECT \"entityId\", \"revisionId\", \"revisionNum\" FROM wh_entity WHERE path = '" +
      ent.path().toDottedPath() + "'";
    quickQuery(db, query, function(err, result) {
      should.not.exist(err);
      result.rows[0].entityId.should.equal(ent._entityId);
      result.rows[0].revisionId.should.equal(ent._revisionId);
      result.rows[0].revisionNum.should.equal(ent._revisionNum);
      done(err);
    });
  });
}

function stepValidateTagExistence(desc, ent) {
  step(desc, function(done) {
    var query = "SELECT \"predPath\", \"objStr\", \"predClass\" FROM wh_tag WHERE \"subjPath\" = '" +
      ent.path().toDottedPath() + "'";
    quickQuery(db, query, function(err, result) {
      should.not.exist(err);
      result.rows[0].predPath.should.equal('navigation');
      result.rows[0].objStr.should.equal('navbar');
      result.rows[0].predClass.should.equal('tag');
      done(err);
    });
  });
}

function stepValidateTagNonExistence(desc, ent) {
  step(desc, function(done) {
    var query = "SELECT \"predPath\", \"objStr\", \"predClass\" FROM wh_tag WHERE \"subjPath\" = '" +
      ent.path().toDottedPath() + "'";
    quickQuery(db, query, function(err, result) {
      should.not.exist(err);
      should.deepEqual(result.rowCount, 0);
      done(err);
    });
  });
}

function stepValidateTagExistencePath(desc, path) {
  step(desc, function(done) {
    var query = "SELECT \"predPath\", \"objStr\", \"predClass\" FROM wh_tag WHERE \"subjPath\" = '" +
      path.toDottedPath() + "'";
    quickQuery(db, query, function(err, result) {
      should.not.exist(err);
      result.rows[0].predPath.should.equal('navigation');
      result.rows[0].objStr.should.equal('navbar');
      result.rows[0].predClass.should.equal('tag');
      done(err);
    });
  });
}

function stepValidateNonEntityExistence(desc, ent) {
  step(desc, function(done) {
    var query = "SELECT \"entityId\", \"revisionId\", \"revisionNum\" FROM wh_entity WHERE path = '" +
      ent.path().toDottedPath() + "'";
    quickQuery(db, query, function(err, result) {
      should.not.exist(err);
      result.rowCount.should.equal(0);
      done(err);
    });
  });
}

function stepGenericRevidCheck(desc, mark, check) {
  step(desc, function(done) {
    var query = "SELECT \"evtClass\", \"entityId\", \"revisionId\", \"revisionNum\", \"evtFinal\", \"evtEnd\" FROM wh_log WHERE \"revisionId\" = '" +
      mark.revisionId + "'";
    quickQuery(db, query, function(err, result) {
      should.not.exist(err);
      check(result);
      done(err);
    });
  });
}

function stepGenericLogCheck(desc, ent, check) {
  step(desc, function(done) {
    var query = "SELECT \"evtClass\", \"entityId\", \"revisionId\", \"revisionNum\", \"evtFinal\", \"evtEnd\" FROM wh_log WHERE path = '" +
      ent.path().toDottedPath() + "'";
    quickQuery(db, query, function(err, result) {
      should.not.exist(err);
      check(result);
      done(err);
    });
  });
}

function checkLogCreate(row, ent) {
  should.deepEqual(row.evtFinal, true);
  should.notDeepEqual(row.evtEnd, null);
  should.deepEqual(row.entityId, ent._entityId);
  should.deepEqual(row.revisionId, ent._revisionId);
  should.deepEqual(row.revisionNum, ent._revisionNum);
}

function checkLogPcreate(row, ent) {
  should.deepEqual(row.evtFinal, false);
  should.deepEqual(row.evtEnd, null);
  should.deepEqual(row.entityId, ent._entityId);
  should.deepEqual(row.revisionId, ent._revisionId);
  should.deepEqual(row.revisionNum, ent._revisionNum);
}

function checkLogDelete(row, ent, delMark) {
  should.deepEqual(row.evtClass, 'delete');
  should.deepEqual(row.entityId, ent._entityId);
  should.deepEqual(row.revisionId, delMark.revisionId);
  should.deepEqual(row.revisionNum, delMark.revisionNum);
}

function checkLogUpdate(row, ent, ent2) {
  should.deepEqual(row.evtClass, 'update');
  should.deepEqual(row.entityId, ent2._entityId);
  should.deepEqual(row.revisionId, ent2._revisionId);
  should.deepEqual(row.revisionNum, ent2._revisionNum);
}

describe('update', function() {
  describe('create-create-delete', function() {
    var now = new Date();
    var ents = {};
    var delMark = {};

    stepGenericCreate('create', new sitepath(['wh', 'create_create_delete']), ents,
      'one', true, now);

    stepValidateEntityExistence('check create', ents.one);

    stepValidateTagExistence('check tag create', ents.one);

    stepGenericLogCheck('check log', ents.one, function(result) {
      var ent = ents.one;
      should.deepEqual(result.rowCount, 1);

    });

    step('try to create again', function(done) {
      update.createEntity(db, {}, ents.one, true, 'create', function(err) {
        if (err) {
          should.deepEqual(err.name, 'DbDuplicateRecordError');
        } else {
          should.fail("didn't catch error");
        }
        done();
      });
    });

    stepValidateTagExistence('check preservation', ents.one);

    stepValidateEntityExistence('verify only one creation went through', ents.one);

    stepGenericLogCheck('verify only one creation went through in log', ents.one,
      function(result) {
        var ent = ents.one;
        should.deepEqual(result.rowCount, 1);
        checkLogCreate(result.rows[0], ent);
      });

    stepGenericDelete('delete', ents.one, delMark);

    stepValidateNonEntityExistence('check create after delete', ents.one);

    stepValidateTagNonExistence('check delete tags', ents.one);

    stepGenericLogCheck('verify create and delete in log', ents.one, function(result) {
      result.rowCount.should.equal(2);
      var ent = ents.one;
      checkLogCreate(result.rows[0], ent);
      checkLogDelete(result.rows[1], ent, delMark);
      should.notDeepEqual(result.rows[0].revisionId, result.rows[1].revisionId);
      should.notDeepEqual(result.rows[0].revisionNum, result.rows[1].revisionNum);
    });
  });

  describe('create-update-delete', function() {
    var now = new Date();
    var ents = {};
    var delMark = {};

    stepGenericCreate('create', new sitepath(['wh', 'create_update_delete']), ents,
      'start', true, now);

    stepValidateEntityExistence('check create', ents.start);

    stepGenericUpdate('update', ents, 'start', 'next');

    stepValidateEntityExistence('verify update', ents.next);

    stepValidateTagExistence('verify the tags are still there', ents.next);

    stepGenericLogCheck('check log after update', ents.start, function(result) {
      var ent = ents.start;
      var ent2 = ents.next;

      should.deepEqual(result.rowCount, 2);
      checkLogCreate(result.rows[0], ent);
      checkLogUpdate(result.rows[1], ent, ent2);
    });

    stepGenericDelete('delete', ents.next, delMark);

    stepValidateNonEntityExistence('check create after delete', ents.next);

    stepValidateTagNonExistence('check delete tags', ents.next);

    stepGenericLogCheck('check log after delete', ents.start, function(result) {
      var ent = ents.start;
      var ent2 = ents.next;

      should.deepEqual(result.rowCount, 3);
      checkLogCreate(result.rows[0], ent);
      checkLogUpdate(result.rows[1], ent, ent2);
      checkLogDelete(result.rows[2], ent, delMark);
      should.notDeepEqual(result.rows[2].revisionId, result.rows[1].revisionId);
      should.notDeepEqual(result.rows[2].revisionNum, result.rows[1].revisionNum);
    });
  });

  describe('create-move-delete', function() {
    var now = new Date();
    var ents = {};
    var moveMark = {};
    var delMark = {};
    var newpath = new sitepath(['wh', 'create_move_delete2']);

    stepGenericCreate('create', new sitepath(['wh', 'create_move_delete']), ents,
      'start', true, now);

    stepValidateEntityExistence('check create', ents.start);

    stepGenericMove('move', ents, 'start', newpath, moveMark);

    stepValidateNonEntityExistence('check create after delete', ents.start);

    stepValidateTagExistencePath('check tag move', newpath);

    stepValidateTagNonExistence('check tag move deletion', ents.start);

    step('validate move', function(done) {
      var query = "SELECT \"entityId\", \"revisionId\", \"revisionNum\" FROM wh_entity WHERE path = '" +
        newpath.toDottedPath() + "'";
      quickQuery(db, query, function(err, result) {
        if (err) {
          return done(err);
        }
        var ent = ents.start;
        should.deepEqual(result.rows[0].entityId, ent._entityId);
        should.deepEqual(result.rows[0].revisionId, moveMark.revisionId);
        should.deepEqual(result.rows[0].revisionNum, moveMark.revisionNum);
        done();
      });
    });

    stepValidateNonEntityExistence('validate moved', ents.start);

    stepGenericLogCheck('check log at old location', ents.start, function(result) {
      var ent = ents.start;

      should.deepEqual(result.rowCount, 2);
      checkLogCreate(result.rows[0], ent);

      should.deepEqual(result.rows[1].evtClass, 'move');
      should.deepEqual(result.rows[1].entityId, ent._entityId);
      should.deepEqual(result.rows[1].revisionId, moveMark.revisionId);
      should.deepEqual(result.rows[1].revisionNum, moveMark.revisionNum);
    });

    step('delete', function(done) {
      var ent = ents.start;
      ent._path = newpath;
      update.deleteEntity(db, {}, ent, true, 'delete',
        function(err, entityId, revisionId, revisionNum) {
          entityId.should.be.an.instanceof(String);
          entityId.should.equal(ent._entityId);
          revisionId.should.be.an.instanceof(String);
          revisionNum.should.be.an.instanceof(Number);
          delMark.revisionId = revisionId;
          delMark.revisionNum = revisionNum;
          done(err);
        });
    });

    stepValidateNonEntityExistence('validate delete', ents.start);

    stepGenericLogCheck('check log at new location', ents.start, function(result) {
      var ent = ents.start;

      should.deepEqual(result.rowCount, 1);
      checkLogDelete(result.rows[0], ent, delMark);
    });
  });

  describe('provisional create', function() {
    var now = new Date();
    var ents = {};
    var delMark = {};
    var commitMark = {};

    stepGenericCreate('create', new sitepath(['wh', 'pcreate']), ents,
      'start', false, now);

    stepValidateNonEntityExistence('validate provisional wont create', ents.start);

    stepGenericLogCheck('check log after provisional create', ents.start, function(result) {
      var ent = ents.start;

      should.deepEqual(result.rowCount, 1);
      checkLogPcreate(result.rows[0], ent);
    });

    stepValidateTagNonExistence('check tag non creation', ents.start);

    step('commit', function(done) {
      update.commitEntityRev(db, {}, ents.start._revisionId,
        function(err, entityId, revisionId, revisionNum) {
          entityId.should.be.an.instanceof(String);
          entityId.should.equal(ents.start._entityId);
          revisionId.should.be.an.instanceof(String);
          revisionNum.should.be.an.instanceof(Number);
          commitMark.revisionId = revisionId;
          commitMark.revisionNum = revisionNum;
          done(err);
        });
    });

    stepValidateEntityExistence('check create', ents.start);

    stepGenericLogCheck('check create log', ents.start, function(result) {
      var ent = ents.start;

      should.deepEqual(result.rowCount, 1);
      checkLogCreate(result.rows[0], ent);
    });

    stepValidateTagExistence('check tag create', ents.start);

    stepGenericDelete('delete', ents.start, delMark);
  });

  it('fails on invalid revisionNum', function(done) {
    update.commitEntityRev(db, {}, uuid.v1(), function(err) {
      if (err) {
        should.deepEqual(err.name, 'RevisionIdNotFoundError');
      } else {
        should.fail('Did not fail when passed an invalid revision id');
      }
      done();
    });
  });

  describe('permit-permit-deny', function() {
    var path = 'wh.permit_permit_deny.*';

    var permissionRec = {};

    step('permit', function(done) {
      update.addPermissionToRole(db, {}, "role", "permission", path, "note",
        function(err, entityId, revisionId, revisionNum) {
          revisionId.should.be.an.instanceof(String);
          revisionNum.should.be.an.instanceof(Number);
          permissionRec.revisionId = revisionId;
          permissionRec.revisionNum = revisionNum;
          done(err);
        }
      );
    });

    stepValidatePermissionExistence('validate addPermissionToRole', path);

    stepGenericRevidCheck('validate log', permissionRec, function(result) {
      should.deepEqual(result.rowCount, 1);
      should.deepEqual(result.rows[0].evtFinal, true);
      should.notDeepEqual(result.rows[0].evtEnd, null);
      should.deepEqual(result.rows[0].revisionId, permissionRec.revisionId);
    });

    step('permit again', function(done) {
      update.addPermissionToRole(db, {}, "role", "permission", path, "note",
        function(err, entityId, revisionId, revisionNum) {
          if (err) {
            should.deepEqual(err.name, 'DbDuplicateRecordError');
            done();
          } else {
            should.fail("didn't catch error");
          }
        }
      );
    });

    stepValidatePermissionExistence('validate failure is ok', path);

    step('remove', function(done) {
      update.removePermissionFromRole(db, {}, "role", "permission", path, "note",
        function(err, entityId, revisionId, revisionNum) {
          revisionId.should.be.an.instanceof(String);
          revisionNum.should.be.an.instanceof(Number);
          permissionRec.revisionId = revisionId;
          permissionRec.revisionNum = revisionNum;
          done(err);
        }
      );
    });

    stepValidatePermissionNonExistence('validate delete', path);
  });

  describe('assign', function() {
    var now = new Date();
    var ents = {};
    var delMark = {};
    var userpath = new sitepath(['wh', 'update_assign']);

    stepGenericCreate('create', userpath, ents, 'one', true, now);

    step('assign', function createAssignmentResource(done) {
      update.assignUserToRole(db, {}, userpath, 'role', 'note', done);
    });

    step('check assign', function checkAssign(done) {
      var query = "SELECT subject, role FROM wh_subject_to_roles WHERE subject = 'wh.update_assign' ORDER BY role ASC";
      quickQuery(db, query, function(err, result) {
        if (err) {
          should.fail(err);
        }
        should.deepEqual(result.rowCount, 1);
        should.deepEqual(result.rows[0].subject, 'wh.update_assign');
        should.deepEqual(result.rows[0].role, 'role');
        done(err);
      });
    });

    stepGenericLogCheck('check create log', ents.one, function(result) {
      var ent = ents.one;
      should.deepEqual(result.rowCount, 2);
      checkLogCreate(result.rows[1], ent);
      should.deepEqual(result.rows[0].evtClass, 'assign');
    });

    step('assign again', function createAssignmentResourceAgain(done) {
      update.assignUserToRole(db, {}, userpath, 'role2', 'note', done);
    });

    step('check assign again', function checkAssignAgain(done) {
      var query = "SELECT subject, role FROM wh_subject_to_roles WHERE subject = 'wh.update_assign' ORDER BY role ASC";
      quickQuery(db, query, function(err, result) {
        if (err) {
          should.fail(err);
        }
        should.deepEqual(result.rowCount, 2);
        should.deepEqual(result.rows[0].subject, 'wh.update_assign');
        should.deepEqual(result.rows[0].role, 'role');
        should.deepEqual(result.rows[1].subject, 'wh.update_assign');
        should.deepEqual(result.rows[1].role, 'role2');
        done();
      });
    });

    step('de-assign', function deleteAssignmentResource(done) {
      update.removeUserFromRole(db, {}, userpath, 'role', 'note', done);
    });

    step('check assign after 1 de-assign', function checkAssignAfter1(done) {
      var query = "SELECT subject, role FROM wh_subject_to_roles WHERE subject = 'wh.update_assign' ORDER BY role ASC";
      quickQuery(db, query, function(err, result) {
        if (err) {
          should.fail(err);
        }
        should.deepEqual(result.rowCount, 1);
        should.deepEqual(result.rows[0].subject, 'wh.update_assign');
        should.deepEqual(result.rows[0].role, 'role2');
        done(err);
      });
    });

    step('de-assign', function deleteAssignmentResource2(done) {
      update.removeUserFromRole(db, {}, userpath, 'role2', 'note', done);
    });

    step('check assign after 2 de-assigns', function checkAssignAfter2(done) {
      var query = "SELECT subject, role FROM wh_subject_to_roles WHERE subject = 'wh.update_assign' ORDER BY role ASC";
      quickQuery(db, query, function(err, result) {
        if (err) {
          should.fail(err);
        }
        should.deepEqual(result.rowCount, 0);
        done(err);
      });
    });

    stepGenericDelete('delete', ents.one, delMark);
  });

  after(function() {
    db.gunDatabase();
  });
});
