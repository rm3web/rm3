var Conf = require ('../../lib/conf');
var entity = require('../../lib/entity');
var sitepath = require ('sitepath');
var async = require('async');
var uuid = require('uuid');
var update = require('../../lib/update');
var db = require('../../lib/db');
var should = require('chai').should();
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

    update.createEntity(db, {}, {context: 'ROOT'}, ents[entidx], provisional, 'create',
      function(err, entityId, revisionId, revisionNum) {
        should.not.exist(err);
        should.exist(entityId);
        entityId.should.be.a('string');
        revisionId.should.be.a('string');
        revisionNum.should.be.a('number');
        ents[entidx]._entityId = entityId;
        ents[entidx]._revisionId = revisionId;
        ents[entidx]._revisionNum = revisionNum;
        done(err);
      });
  });
}

function stepGenericUpdate(desc, ents, startidx, nextidx, provisional, sameRevision) {
  ents[nextidx] = ents[startidx].clone();
  ents[nextidx].data.posting = "<div>blah blah blah</div>";
  step(desc, function(done) {
    update.updateEntity(db, {}, {context: "ROOT"}, ents[startidx], ents[nextidx], provisional, sameRevision, 'update',
      function(err, entityId, revisionId, revisionNum) {
        should.not.exist(err);
        should.exist(entityId);
        entityId.should.be.a('string');
        revisionId.should.be.a('string');
        revisionNum.should.be.a('number');
        ents[nextidx]._entityId = entityId;
        ents[nextidx]._revisionId = revisionId;
        ents[nextidx]._revisionNum = revisionNum;
        done(err);
      });
  });
}

function stepGenericMove(desc, ents, startidx, newpath, moveMark) {
  step(desc, function(done) {
    update.moveEntity(db, {}, {context: 'ROOT'}, ents[startidx], newpath, true, 'move',
      function(err, entityId, revisionId, revisionNum) {
        should.not.exist(err);
        should.exist(entityId);
        entityId.should.be.a('string');
        revisionId.should.be.a('string');
        revisionNum.should.be.a('number');
        moveMark.revisionId = revisionId;
        moveMark.revisionNum = revisionNum;
        done(err);
      });
  });
}

function stepGenericDelete(desc, ent, delMark) {
  step(desc, function(done) {
    update.deleteEntity(db, {}, {context: 'ROOT'}, ent, true, 'delete',
      function(err, entityId, revisionId, revisionNum) {
        should.not.exist(err);
        should.exist(entityId);
        entityId.should.be.a('string');
        revisionId.should.be.a('string');
        revisionNum.should.be.a('number');
        entityId.should.equal(ent._entityId);
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
      result.rowCount.should.equal(0);
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
      result.rowCount.should.equal(1);
      result.rows[0].entityId.should.equal(ent._entityId);
      result.rows[0].revisionId.should.equal(ent._revisionId);
      result.rows[0].revisionNum.should.equal(ent._revisionNum);
      done(err);
    });
  });
}

function stepValidateTagExistence(desc, ent) {
  step(desc, function(done) {
    var query = "SELECT \"predPath\", \"objStr\", \"objClass\" FROM wh_tag WHERE \"subjPath\" = '" +
      ent.path().toDottedPath() + "'";
    quickQuery(db, query, function(err, result) {
      should.not.exist(err);
      result.rows[0].predPath.should.equal('navigation');
      result.rows[0].objStr.should.equal('navbar');
      result.rows[0].objClass.should.equal('tag');
      done(err);
    });
  });
}

function stepValidateTagNonExistence(desc, ent) {
  step(desc, function(done) {
    var query = "SELECT \"predPath\", \"objStr\", \"objClass\" FROM wh_tag WHERE \"subjPath\" = '" +
      ent.path().toDottedPath() + "'";
    quickQuery(db, query, function(err, result) {
      should.not.exist(err);
      result.rowCount.should.equal(0);
      done(err);
    });
  });
}

function stepValidateTagExistencePath(desc, path) {
  step(desc, function(done) {
    var query = "SELECT \"predPath\", \"objStr\", \"objClass\" FROM wh_tag WHERE \"subjPath\" = '" +
      path.toDottedPath() + "'";
    quickQuery(db, query, function(err, result) {
      should.not.exist(err);
      result.rows[0].predPath.should.equal('navigation');
      result.rows[0].objStr.should.equal('navbar');
      result.rows[0].objClass.should.equal('tag');
      done(err);
    });
  });
}

function stepValidateNonEntityExistence(desc, ent) {
  step(desc, function(done) {
    var query = "SELECT stub, \"entityId\", \"revisionId\", \"revisionNum\" FROM wh_entity WHERE path = '" +
      ent.path().toDottedPath() + "'";
    quickQuery(db, query, function(err, result) {
      should.not.exist(err);
      if (result.rowCount === 1) {
        result.rows[0].stub.should.equal(true);
      }
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
      ent.path().toDottedPath() + "' ORDER BY \"evtEnd\"";
    quickQuery(db, query, function(err, result) {
      should.not.exist(err);
      check(result);
      done(err);
    });
  });
}

function checkLogCreate(row, ent) {
  row.evtFinal.should.equal(true);
  row.evtEnd.should.not.equal(null);
  row.entityId.should.eql(ent._entityId);
  row.revisionId.should.eql(ent._revisionId);
  row.revisionNum.should.eql(ent._revisionNum);
}

function checkLogPcreate(row, ent) {
  row.evtFinal.should.equal(false);
  should.not.exist(row.evtEnd);
  row.entityId.should.eql(ent._entityId);
  row.revisionId.should.eql(ent._revisionId);
  row.revisionNum.should.eql(ent._revisionNum);
}

function checkLogDelete(row, ent, delMark) {
  row.evtClass.should.equal('Delete');
  row.entityId.should.eql(ent._entityId);
  row.revisionId.should.eql(delMark.revisionId);
  row.revisionNum.should.eql(delMark.revisionNum);
}

function checkLogUpdate(row, ent, ent2) {
  row.evtClass.should.equal('Update');
  row.entityId.should.eql(ent2._entityId);
  row.revisionId.should.eql(ent2._revisionId);
  row.revisionNum.should.eql(ent2._revisionNum);
}

describe('update', function() {
  this.timeout(8000); // This might take a bit of time

  describe('create-create-delete-create-delete', function() {
    var now = new Date();
    var ents = {};
    var delMark = {};

    stepGenericCreate('create', new sitepath(['wh', 'create_create_delete']), ents,
      'one', true, now);

    stepValidateEntityExistence('check create', ents.one);

    stepValidateTagExistence('check tag create', ents.one);

    stepGenericLogCheck('check log', ents.one, function(result) {
      var ent = ents.one;
      result.rowCount.should.equal(1);

    });

    step('try to create again', function(done) {
      update.createEntity(db, {}, {context: 'ROOT'}, ents.one, true, 'create', function(err) {
        if (err) {
          err.name.should.equal('DbDuplicateRecordError');
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
        result.rowCount.should.equal(1);
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
      result.rows[0].revisionId.should.not.eql(result.rows[1].revisionId);
      result.rows[0].revisionNum.should.not.eql(result.rows[1].revisionNum);
    });

    stepGenericCreate('create', new sitepath(['wh', 'create_create_delete']), ents,
      'two', true, now);

    stepValidateEntityExistence('check create', ents.two);

    stepGenericDelete('delete', ents.two, delMark);
  });

  describe('create-update-delete', function() {
    var now = new Date();
    var ents = {};
    var delMark = {};

    stepGenericCreate('create', new sitepath(['wh', 'create_update_delete']), ents,
      'start', true, now);

    stepValidateEntityExistence('check create', ents.start);

    stepGenericUpdate('update', ents, 'start', 'next', true, false);

    stepValidateEntityExistence('verify update', ents.next);

    stepValidateTagExistence('verify the tags are still there', ents.next);

    stepGenericLogCheck('check log after update', ents.start, function(result) {
      var ent = ents.start;
      var ent2 = ents.next;

      result.rowCount.should.equal(2);
      checkLogCreate(result.rows[0], ent);
      checkLogUpdate(result.rows[1], ent, ent2);
    });

    stepGenericDelete('delete', ents.next, delMark);

    stepValidateNonEntityExistence('check create after delete', ents.next);

    stepValidateTagNonExistence('check delete tags', ents.next);

    stepGenericLogCheck('check log after delete', ents.start, function(result) {
      var ent = ents.start;
      var ent2 = ents.next;

      result.rowCount.should.equal(3);
      checkLogCreate(result.rows[0], ent);
      checkLogUpdate(result.rows[1], ent, ent2);
      checkLogDelete(result.rows[2], ent, delMark);
      result.rows[2].revisionId.should.not.eql(result.rows[1].revisionId);
      result.rows[2].revisionNum.should.not.eql(result.rows[1].revisionNum);
    });
  });

  describe('create-update-sameRevisionUpdate-delete', function() {
    var now = new Date();
    var ents = {};
    var delMark = {};

    stepGenericCreate('create', new sitepath(['wh', 'create_update_sru_delete']), ents,
      'start', true, now);

    stepValidateEntityExistence('check create', ents.start);

    stepGenericUpdate('update', ents, 'start', 'next', false, false);

    stepGenericUpdate('update', ents, 'next', 'final', false, true);

    step('commit', function(done) {
      update.commitEntityRev(db, {}, ents.final._revisionId,
        function(err, entityId, revisionId, revisionNum) {
          if (err) {
            should.fail(err);
          }
          entityId.should.be.a('string');
          entityId.should.equal(ents.start._entityId);
          revisionId.should.be.a('string');
          revisionNum.should.be.a('number');
          done(err);
        });
    });

    stepValidateEntityExistence('verify update', ents.next);

    stepValidateTagExistence('verify the tags are still there', ents.next);

    stepGenericLogCheck('check log after update', ents.start, function(result) {
      var ent = ents.start;
      var ent2 = ents.next;

      result.rowCount.should.equal(2);
      checkLogCreate(result.rows[0], ent);
      checkLogUpdate(result.rows[1], ent, ent2);
    });

    stepGenericDelete('delete', ents.next, delMark);

    stepValidateNonEntityExistence('check create after delete', ents.next);

    stepValidateTagNonExistence('check delete tags', ents.next);

    stepGenericLogCheck('check log after delete', ents.start, function(result) {
      var ent = ents.start;
      var ent2 = ents.next;

      result.rowCount.should.equal(3);
      checkLogCreate(result.rows[0], ent);
      checkLogUpdate(result.rows[1], ent, ent2);
      checkLogDelete(result.rows[2], ent, delMark);
      result.rows[2].revisionId.should.not.eql(result.rows[1].revisionId);
      result.rows[2].revisionNum.should.not.eql(result.rows[1].revisionNum);
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
        result.rows[0].entityId.should.eql(ent._entityId);
        result.rows[0].revisionId.should.eql(moveMark.revisionId);
        result.rows[0].revisionNum.should.eql(moveMark.revisionNum);
        done();
      });
    });

    stepValidateNonEntityExistence('validate moved', ents.start);

    stepGenericLogCheck('check log at old location', ents.start, function(result) {
      var ent = ents.start;

      result.rowCount.should.equal(2);
      checkLogCreate(result.rows[0], ent);

      result.rows[1].evtClass.should.eql('Move');
      result.rows[1].entityId.should.eql(ent._entityId);
      result.rows[1].revisionId.should.eql(moveMark.revisionId);
      result.rows[1].revisionNum.should.eql(moveMark.revisionNum);
    });

    step('delete', function(done) {
      var ent = ents.start;
      ent._path = newpath;
      update.deleteEntity(db, {}, {context: 'ROOT'}, ent, true, 'delete',
        function(err, entityId, revisionId, revisionNum) {
          entityId.should.be.a('string');
          entityId.should.equal(ent._entityId);
          revisionId.should.be.a('string');
          revisionNum.should.be.a('number');
          delMark.revisionId = revisionId;
          delMark.revisionNum = revisionNum;
          done(err);
        });
    });

    stepValidateNonEntityExistence('validate delete', ents.start);

    stepGenericLogCheck('check log at new location', ents.start, function(result) {
      var ent = ents.start;

      result.rowCount.should.equal(1);
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

      result.rowCount.should.equal(1);
      checkLogPcreate(result.rows[0], ent);
    });

    stepValidateTagNonExistence('check tag non creation', ents.start);

    step('commit', function(done) {
      update.commitEntityRev(db, {}, ents.start._revisionId,
        function(err, entityId, revisionId, revisionNum) {
          if (err) {
            should.fail(err);
          }
          entityId.should.be.a('string');
          entityId.should.equal(ents.start._entityId);
          revisionId.should.be.a('string');
          revisionNum.should.be.a('number');
          commitMark.revisionId = revisionId;
          commitMark.revisionNum = revisionNum;
          done(err);
        });
    });

    stepValidateEntityExistence('check create', ents.start);

    stepGenericLogCheck('check create log', ents.start, function(result) {
      var ent = ents.start;

      result.rowCount.should.equal(1);
      checkLogCreate(result.rows[0], ent);
    });

    stepValidateTagExistence('check tag create', ents.start);

    stepGenericDelete('delete', ents.start, delMark);
  });

  describe('provisional create-provisional update-create', function() {
    var now = new Date();
    var ents = {};
    var delMark = {};
    var commitMark = {};

    stepGenericCreate('create', new sitepath(['wh', 'pcreate2']), ents,
      'start', false, now);

    stepValidateNonEntityExistence('validate provisional wont create', ents.start);

    stepGenericLogCheck('check log after provisional create', ents.start, function(result) {
      var ent = ents.start;

      result.rowCount.should.equal(1);
      checkLogPcreate(result.rows[0], ent);
    });

    stepValidateTagNonExistence('check tag non creation', ents.start);

    stepGenericUpdate('update', ents, 'start', 'next', true, false);

    step('commit', function(done) {
      update.commitEntityRev(db, {}, ents.next._revisionId,
        function(err, entityId, revisionId, revisionNum) {
          if (err) {
            should.fail(err);
          }
          entityId.should.be.a('string');
          entityId.should.equal(ents.next._entityId);
          revisionId.should.be.a('string');
          revisionNum.should.be.a('number');
          commitMark.revisionId = revisionId;
          commitMark.revisionNum = revisionNum;
          done(err);
        });
    });

    stepValidateEntityExistence('check create', ents.start);

    stepGenericLogCheck('check create log', ents.next, function(result) {
      var ent = ents.next;

      result.rowCount.should.equal(1);
      checkLogCreate(result.rows[0], ent);
    });

    stepValidateTagExistence('check tag create', ents.next);

    stepGenericDelete('delete', ents.next, delMark);
  });

  it('fails on invalid revisionNum', function(done) {
    update.commitEntityRev(db, {}, uuid.v1(), function(err) {
      if (err) {
        err.name.should.equal('RevisionIdNotFoundError');
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
      update.addPermissionToRole(db, {}, {context: 'ROOT'}, "role", "permission", path, "note",
        function(err, entityId, revisionId, revisionNum) {
          revisionId.should.be.a('string');
          revisionNum.should.be.a('number');
          permissionRec.revisionId = revisionId;
          permissionRec.revisionNum = revisionNum;
          done(err);
        }
      );
    });

    stepValidatePermissionExistence('validate addPermissionToRole', path);

    stepGenericRevidCheck('validate log', permissionRec, function(result) {
      result.rowCount.should.equal(1);
      result.rows[0].evtFinal.should.eql(true);
      result.rows[0].evtEnd.should.not.eql(null);
      result.rows[0].revisionId.should.eql(permissionRec.revisionId);
    });

    step('permit again', function(done) {
      update.addPermissionToRole(db, {}, {context: 'ROOT'}, "role", "permission", path, "note",
        function(err, entityId, revisionId, revisionNum) {
          if (err) {
            err.name.should.equal('DbDuplicateRecordError');
            done();
          } else {
            should.fail("didn't catch error");
          }
        }
      );
    });

    stepValidatePermissionExistence('validate failure is ok', path);

    step('remove', function(done) {
      update.removePermissionFromRole(db, {}, {context: 'ROOT'}, "role", "permission", path, "note",
        function(err, entityId, revisionId, revisionNum) {
          revisionId.should.be.a('string');
          revisionNum.should.be.a('number');
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
      update.assignUserToRole(db, {}, {context: 'ROOT'}, userpath, 'role', 'note', done);
    });

    step('check assign', function checkAssign(done) {
      var query = "SELECT subject, role FROM wh_subject_to_roles WHERE subject = 'wh.update_assign' ORDER BY role ASC";
      quickQuery(db, query, function(err, result) {
        if (err) {
          should.fail(err);
        }
        result.rowCount.should.equal(1);
        result.rows[0].subject.should.equal('wh.update_assign');
        result.rows[0].role.should.equal('role');
        done(err);
      });
    });

    stepGenericLogCheck('check create log', ents.one, function(result) {
      var ent = ents.one;
      result.rowCount.should.equal(2);
      checkLogCreate(result.rows[0], ent);
      result.rows[1].evtClass.should.equal('rm3:assign');
    });

    step('assign again', function createAssignmentResourceAgain(done) {
      update.assignUserToRole(db, {}, {context: 'ROOT'}, userpath, 'role2', 'note', done);
    });

    step('check assign again', function checkAssignAgain(done) {
      var query = "SELECT subject, role FROM wh_subject_to_roles WHERE subject = 'wh.update_assign' ORDER BY role ASC";
      quickQuery(db, query, function(err, result) {
        if (err) {
          should.fail(err);
        }
        result.rowCount.should.equal(2);
        result.rows[0].subject.should.equal('wh.update_assign');
        result.rows[0].role.should.equal('role');
        result.rows[1].subject.should.equal('wh.update_assign');
        result.rows[1].role.should.equal('role2');
        done();
      });
    });

    step('de-assign', function deleteAssignmentResource(done) {
      update.removeUserFromRole(db, {}, {context: 'ROOT'}, userpath, 'role', 'note', done);
    });

    step('check assign after 1 de-assign', function checkAssignAfter1(done) {
      var query = "SELECT subject, role FROM wh_subject_to_roles WHERE subject = 'wh.update_assign' ORDER BY role ASC";
      quickQuery(db, query, function(err, result) {
        if (err) {
          should.fail(err);
        }
        result.rowCount.should.equal(1);
        result.rows[0].subject.should.equal('wh.update_assign');
        result.rows[0].role.should.equal('role2');
        done(err);
      });
    });

    step('de-assign', function deleteAssignmentResource2(done) {
      update.removeUserFromRole(db, {}, {context: 'ROOT'}, userpath, 'role2', 'note', done);
    });

    step('check assign after 2 de-assigns', function checkAssignAfter2(done) {
      var query = "SELECT subject, role FROM wh_subject_to_roles WHERE subject = 'wh.update_assign' ORDER BY role ASC";
      quickQuery(db, query, function(err, result) {
        if (err) {
          should.fail(err);
        }
        result.rowCount.should.equal(0);
        done(err);
      });
    });

    stepGenericDelete('delete', ents.one, delMark);
  });

  describe('credential', function() {
    var ents = {};
    var delMark = {};
    var userpath = new sitepath(['wh', 'credential']);

    step('create', function createCredential(done) {
      update.createCredential(db, {}, 'test', 'gor', null, {}, done);
    });

    step('check create credential', function checkCredential(done) {
      var query = "SELECT provider, \"userId\", \"userPath\" FROM wh_credential WHERE provider = 'test' AND \"userId\" = 'gor';";
      quickQuery(db, query, function(err, result) {
        if (err) {
          should.fail(err);
        }
        result.rowCount.should.equal(1);
        result.rows[0].provider.should.equal('test');
        result.rows[0].userId.should.equal('gor');
        should.not.exist(result.rows[0].userPath);
        done(err);
      });
    });

    step('update', function createCredential(done) {
      update.updateCredential(db, {}, 'test', 'store', {}, done);
    });

    step('check update credential', function checkCredential(done) {
      var query = "SELECT provider, \"userId\", \"userPath\" FROM wh_credential WHERE provider = 'test' AND \"userId\" = 'gor';";
      quickQuery(db, query, function(err, result) {
        if (err) {
          should.fail(err);
        }
        result.rowCount.should.equal(1);
        result.rows[0].provider.should.equal('test');
        result.rows[0].userId.should.equal('gor');
        should.not.exist(result.rows[0].userPath);
        done(err);
      });
    });
  });

  describe('blob', function() {
    var ents = {};
    var delMark = {};
    var entityPath = new sitepath(['wh', 'blob', 'update']);
    var revisionId = uuid.v1();

    step('create', function createCredential(done) {
      update.addBlob(db, {}, 'test', 'test', entityPath.toDottedPath(), 'blobpath', revisionId, true, true, {'angels': true}, done);
    });

    step('check create blob', function checkCredential(done) {
      var query = "SELECT provider, \"entityPath\", \"details\" FROM wh_blob WHERE provider = 'test' AND \"entityPath\" = 'wh.blob.update';";
      quickQuery(db, query, function(err, result) {
        if (err) {
          should.fail(err);
        }
        result.rowCount.should.equal(1);
        result.rows[0].provider.should.eql('test');
        result.rows[0].entityPath.should.eql('wh.blob.update');
        result.rows[0].details.should.eql({'angels': true});
        done(err);
      });
    });

    step('delete', function createCredential(done) {
      update.deleteBlob(db, {}, 'test', 'test', entityPath.toDottedPath(), 'blobpath', revisionId, done);
    });

    step('check delete blob', function checkCredential(done) {
      var query = "SELECT provider, \"entityPath\", \"details\" FROM wh_blob WHERE provider = 'test' AND \"entityPath\" = 'wh.blob.update';";
      quickQuery(db, query, function(err, result) {
        if (err) {
          should.fail(err);
        }
        result.rowCount.should.equal(0);
        done(err);
      });
    });
  });

  after(function() {
    db.gunDatabase();
  });
});
