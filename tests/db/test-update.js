var Conf = require ('../../lib/conf');
var entity = require('../../lib/entity');
var sitepath = require ('../../lib/sitepath');
var async = require('async');
var uuid = require('node-uuid');
var update = require('../../lib/update');
var db = require('../../lib/db');
var should = require('should');
require('mocha-steps');

function quick_query(db, querytext, next) {
  async.waterfall([
    db.connectWrap,
    function(client, done, callback){
      client.query(querytext, function(err, result){
        done(err);
        callback(err, result);
      });
    }
  ], next);
}

function step_generic_create(desc, path, ents, entidx, provisional, now) {
  ents[entidx] = new entity.Entity();
  step(desc, function(done) {
    var longstr = '<div></div>';
    ents[entidx].createNew(path, 'base', now);
    ents[entidx].summary = {"title": "blrg",
      "abstract": "some text goes here"};
    ents[entidx].data.posting = longstr;
    ents[entidx].addTag('navigation','navbar');

    update.create_entity(db, ents[entidx], provisional, 'create', 
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

function step_generic_update(desc, ents, startidx, nextidx) {
  ents[nextidx] = ents[startidx].clone();
  ents[nextidx].data.posting = "<div>blah blah blah</div>";
  step(desc, function(done) {
    update.update_entity(db, ents[startidx], ents[nextidx], true, 'update', 
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

function step_generic_move(desc, ents, startidx, newpath, move_mark) {
  step(desc, function(done) {
    update.move_entity(db, ents[startidx], newpath, true, 'move', 
      function(err, entityId, revisionId, revisionNum) {
        should.not.exist(err);
        should.exist(entityId);
        entityId.should.be.an.instanceof(String);
        revisionId.should.be.an.instanceof(String);
        revisionNum.should.be.an.instanceof(Number);
        move_mark.revisionId = revisionId;
        move_mark.revisionNum = revisionNum;
        done(err);
      });
  });
}

function step_generic_delete(desc, ent, delMark) {
  step(desc, function(done) {
    update.delete_entity(db, ent, true, 'delete',
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

function step_validate_permission_existence(desc, path) {
  step(desc, function(done) {
    var query = "SELECT role, permission, path FROM wh_permission_to_role WHERE path = '" + 
      path + "'";
    quick_query(db, query, function(err, result) {
      should.not.exist(err); 
      result.rows[0].role.should.equal('role');
      result.rows[0].permission.should.equal('permission');
      result.rows[0].path.should.equal(path);
      done(err);
    });
  });
}

function step_validate_permission_non_existence(desc, path) {
  step(desc, function(done) {
    var query = "SELECT role, permission, path FROM wh_permission_to_role WHERE path = '" + 
      path + "'";
    quick_query(db, query, function(err, result) {
      should.not.exist(err);
      should.deepEqual(result.rowCount, 0);
      done(err);
    });
  });
}

function step_validate_entity_existence(desc, ent) {
  step(desc, function(done) {
    var query = "SELECT \"entityId\", \"revisionId\", \"revisionNum\" FROM wh_entity WHERE path = '" +
      ent.path().toDottedPath() + "'";
    quick_query(db, query, function(err, result) {
      should.not.exist(err);
      result.rows[0].entityId.should.equal(ent._entityId);
      result.rows[0].revisionId.should.equal(ent._revisionId);
      result.rows[0].revisionNum.should.equal(ent._revisionNum);
      done(err);
    });
  });
}

function step_validate_tag_existence(desc, ent) {
  step(desc, function(done) {
    var query = "SELECT \"predPath\", \"objStr\", \"predClass\" FROM wh_tag WHERE \"subjPath\" = '" +
      ent.path().toDottedPath() + "'";
    quick_query(db, query, function(err, result) {
      should.not.exist(err);
      result.rows[0].predPath.should.equal('navigation');
      result.rows[0].objStr.should.equal('navbar');
      result.rows[0].predClass.should.equal('tag');
      done(err);
    });
  });
}

function step_validate_tag_non_existence(desc, ent) {
  step(desc, function(done) {
    var query = "SELECT \"predPath\", \"objStr\", \"predClass\" FROM wh_tag WHERE \"subjPath\" = '" +
      ent.path().toDottedPath() + "'";
    quick_query(db, query, function(err, result) {
      should.not.exist(err);
      should.deepEqual(result.rowCount, 0);
      done(err);
    });
  });
}

function step_validate_tag_existence_path(desc, path) {
  step(desc, function(done) {
    var query = "SELECT \"predPath\", \"objStr\", \"predClass\" FROM wh_tag WHERE \"subjPath\" = '" +
      path.toDottedPath() + "'";
    quick_query(db, query, function(err, result) {
      should.not.exist(err);
      result.rows[0].predPath.should.equal('navigation');
      result.rows[0].objStr.should.equal('navbar');
      result.rows[0].predClass.should.equal('tag');
      done(err);
    });
  });
}

function step_validate_non_entity_existence(desc, ent) {
  step(desc, function(done) {
  var query = "SELECT \"entityId\", \"revisionId\", \"revisionNum\" FROM wh_entity WHERE path = '" +
    ent.path().toDottedPath() + "'";
    quick_query(db, query, function(err, result) {
      should.not.exist(err);
      result.rowCount.should.equal(0);
      done(err);
    });
  });
}

function step_generic_revid_check(desc, mark, check) {
  step(desc, function(done) {
    var query = "SELECT \"evtClass\", \"entityId\", \"revisionId\", \"revisionNum\", \"evtFinal\", \"evtEnd\" FROM wh_log WHERE \"revisionId\" = '" +
      mark.revisionId + "'";
    quick_query(db, query, function(err, result) {
      should.not.exist(err);
      check(result);
      done(err);
    });
  });
}

function step_generic_log_check(desc, ent, check) {
  step(desc, function(done) {
    var query = "SELECT \"evtClass\", \"entityId\", \"revisionId\", \"revisionNum\", \"evtFinal\", \"evtEnd\" FROM wh_log WHERE path = '" +
      ent.path().toDottedPath() + "'";
    quick_query(db, query, function(err, result) {
      should.not.exist(err);
      check(result);
      done(err);
    });
  });
}

function check_log_create(row, ent) {
  should.deepEqual(row.evtFinal, true);
  should.notDeepEqual(row.evtEnd, null);
  should.deepEqual(row.entityId, ent._entityId);
  should.deepEqual(row.revisionId, ent._revisionId);
  should.deepEqual(row.revisionNum, ent._revisionNum);
}

function check_log_pcreate(row, ent) {
  should.deepEqual(row.evtFinal, false);
  should.deepEqual(row.evtEnd, null);
  should.deepEqual(row.entityId, ent._entityId);
  should.deepEqual(row.revisionId, ent._revisionId);
  should.deepEqual(row.revisionNum, ent._revisionNum);
}

function check_log_delete(row, ent, delMark) {
  should.deepEqual(row.evtClass, 'delete');
  should.deepEqual(row.entityId, ent._entityId);
  should.deepEqual(row.revisionId, delMark.revisionId);
  should.deepEqual(row.revisionNum, delMark.revisionNum);
}

function check_log_update(row, ent, ent2) {
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

    step_generic_create('create', new sitepath(['wh', 'create_create_delete']), ents, 
      'one', true, now);

    step_validate_entity_existence('check create', ents.one);

    step_validate_tag_existence('check tag create', ents.one);

    step_generic_log_check('check log', ents.one, function(result) {
      var ent = ents.one;
      should.deepEqual(result.rowCount, 1);

    });

    step('try to create again', function(done) {
      update.create_entity(db, ents.one, true, 'create', function(err) {
        if (err) {
          should.deepEqual(err.name, 'DbDuplicateRecordError');
        } else {
          should.fail("didn't catch error");
        }
        done();
      });
    });

    step_validate_tag_existence('check preservation', ents.one);

    step_validate_entity_existence('verify only one creation went through', ents.one);

    step_generic_log_check('verify only one creation went through in log', ents.one,
      function(result) {
        var ent = ents.one;
        should.deepEqual(result.rowCount, 1);
        check_log_create(result.rows[0],ent);
    });

    step_generic_delete('delete', ents.one, delMark);

    step_validate_non_entity_existence('check create after delete', ents.one);

    step_validate_tag_non_existence('check delete tags', ents.one);

    step_generic_log_check('verify create and delete in log', ents.one, function(result) {
      result.rowCount.should.equal(2);
      var ent = ents.one;
      check_log_create(result.rows[0],ent);
      check_log_delete(result.rows[1],ent,delMark);
      should.notDeepEqual(result.rows[0].revisionId, result.rows[1].revisionId);
      should.notDeepEqual(result.rows[0].revisionNum, result.rows[1].revisionNum);
    });
  });

  describe('create-update-delete', function() {
    var now = new Date();
    var ents = {};
    var delMark = {};

    step_generic_create('create', new sitepath(['wh', 'create_update_delete']), ents, 
      'start', true, now);

    step_validate_entity_existence('check create', ents.start);

    step_generic_update('update', ents, 'start', 'next');

    step_validate_entity_existence('verify update', ents.next);

    step_validate_tag_existence('verify the tags are still there', ents.next);

    step_generic_log_check('check log after update', ents.start, function(result) {
      var ent = ents.start;
      var ent2 = ents.next;

      should.deepEqual(result.rowCount, 2);
      check_log_create(result.rows[0],ent);
      check_log_update(result.rows[1],ent, ent2);
    });

    step_generic_delete('delete', ents.next, delMark);

    step_validate_non_entity_existence('check create after delete', ents.next);

    step_validate_tag_non_existence('check delete tags', ents.next);

    step_generic_log_check('check log after delete', ents.start, function(result) {
      var ent = ents.start;
      var ent2 = ents.next;

      should.deepEqual(result.rowCount, 3);
      check_log_create(result.rows[0],ent);
      check_log_update(result.rows[1],ent, ent2);
      check_log_delete(result.rows[2],ent,delMark);
      should.notDeepEqual(result.rows[2].revisionId, result.rows[1].revisionId);
      should.notDeepEqual(result.rows[2].revisionNum, result.rows[1].revisionNum);
    });
  });

  describe('create-move-delete', function() {
    var now = new Date();
    var ents = {};
    var move_mark = {};
    var delMark = {};
    var newpath = new sitepath(['wh','create_move_delete2']);

    step_generic_create('create', new sitepath(['wh', 'create_move_delete']), ents, 
      'start', true, now);

    step_validate_entity_existence('check create', ents.start);

    step_generic_move('move', ents, 'start', newpath, move_mark);

    step_validate_non_entity_existence('check create after delete', ents.start);

    step_validate_tag_existence_path('check tag move', newpath);

    step_validate_tag_non_existence('check tag move deletion', ents.start);

    step('validate move', function(done) {
      var query = "SELECT \"entityId\", \"revisionId\", \"revisionNum\" FROM wh_entity WHERE path = '" +
        newpath.toDottedPath() + "'";
      quick_query(db, query, function(err, result) {
        if(err) {
          return done(err);
        }
        var ent = ents.start;
        should.deepEqual(result.rows[0].entityId, ent._entityId);
        should.deepEqual(result.rows[0].revisionId, move_mark.revisionId);
        should.deepEqual(result.rows[0].revisionNum, move_mark.revisionNum);
        done();
      });
    });

    step_validate_non_entity_existence('validate moved', ents.start);

    step_generic_log_check('check log at old location', ents.start, function(result) {
      var ent = ents.start;

      should.deepEqual(result.rowCount, 2);
      check_log_create(result.rows[0],ent);

      should.deepEqual(result.rows[1].evtClass, 'move');
      should.deepEqual(result.rows[1].entityId, ent._entityId);
      should.deepEqual(result.rows[1].revisionId, move_mark.revisionId);
      should.deepEqual(result.rows[1].revisionNum, move_mark.revisionNum);
    });

    step('delete', function(done) {
      var ent = ents.start;
      ent._path = newpath;
      update.delete_entity(db, ent, true, 'delete',
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

    step_validate_non_entity_existence('validate delete', ents.start);

    step_generic_log_check('check log at new location', ents.start, function(result) {
      var ent = ents.start;

      should.deepEqual(result.rowCount, 1);
      check_log_delete(result.rows[0],ent,delMark);
    });
  });

  describe('provisional create', function() {
    var now = new Date();
    var ents = {};
    var delMark = {};
    var commitMark = {};

    step_generic_create('create', new sitepath(['wh', 'pcreate']), ents, 
      'start', false, now);

    step_validate_non_entity_existence('validate provisional wont create', ents.start);

    step_generic_log_check('check log after provisional create', ents.start, function(result) {
      var ent = ents.start;

      should.deepEqual(result.rowCount, 1);
      check_log_pcreate(result.rows[0],ent);
    });

    step_validate_tag_non_existence('check tag non creation', ents.start);

    step('commit', function(done) {
      update.commit_entity_rev(db, ents.start._revisionId,
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

    step_validate_entity_existence('check create', ents.start);

    step_generic_log_check('check create log', ents.start, function(result) {
      var ent = ents.start;

      should.deepEqual(result.rowCount, 1);
      check_log_create(result.rows[0],ent);
    });

    step_validate_tag_existence('check tag create', ents.start);

    step_generic_delete('delete', ents.start, delMark);
  });

  it('fails on invalid revisionNum', function(done) {
    update.commit_entity_rev(db, uuid.v1(), function(err) {
      if(err) {
        should.deepEqual(err.name, 'RevisionIdNotFoundError');
      } else {
        should.fail('Did not fail when passed an invalid revision id');
      }
      done();
    });
  });

  describe('permit-permit-deny', function() {
    var path = 'wh.permit_permit_deny.*';

    var permission_rec = {};

    step('permit', function(done) {
      update.add_permission_to_role(db, "role", "permission", path, "note", 
        function(err, entityId, revisionId, revisionNum)
        {
          revisionId.should.be.an.instanceof(String);
          revisionNum.should.be.an.instanceof(Number);
          permission_rec.revisionId = revisionId;
          permission_rec.revisionNum = revisionNum;
          done(err);
        }
      );
    });

    step_validate_permission_existence('validate add_permission_to_role', path);

    step_generic_revid_check('validate log', permission_rec, function(result){
      should.deepEqual(result.rowCount, 1);
      should.deepEqual(result.rows[0].evtFinal, true);
      should.notDeepEqual(result.rows[0].evtEnd, null);
      should.deepEqual(result.rows[0].revisionId, permission_rec.revisionId);
    });

    step('permit again', function(done) {
      update.add_permission_to_role(db, "role", "permission", path, "note", 
        function(err, entityId, revisionId, revisionNum)
        {
          if (err) {
            should.deepEqual(err.name, 'DbDuplicateRecordError');
            done();
          } else {
            should.fail("didn't catch error");
          }
        }
      );
    });

    step_validate_permission_existence('validate failure is ok', path);

    step('remove', function(done) {
      update.remove_permission_from_role(db, "role", "permission", path, "note", 
        function(err, entityId, revisionId, revisionNum)
        {
          revisionId.should.be.an.instanceof(String);
          revisionNum.should.be.an.instanceof(Number);
          permission_rec.revisionId = revisionId;
          permission_rec.revisionNum = revisionNum;
          done(err);
        }
      );
    });

    step_validate_permission_non_existence('validate delete', path);
  });

  describe('assign', function() {
    var now = new Date();
    var ents = {};
    var delMark = {};
    var userpath = new sitepath(['wh', 'update_assign']);

    step_generic_create('create', userpath, ents, 'one', true, now);

    step('assign', function create_assignment_resource(done) {
      update.assign_user_to_role(db, userpath, 'role', 'note', done);
    });

    step('check assign', function check_assign(done) {
      var query = "SELECT subject, role FROM wh_subject_to_roles WHERE subject = 'wh.update_assign' ORDER BY role ASC";
      quick_query(db, query, function(err, result) {
        if(err) {
          should.fail(err);
        }
        should.deepEqual(result.rowCount, 1);
        should.deepEqual(result.rows[0].subject, 'wh.update_assign');
        should.deepEqual(result.rows[0].role, 'role');
        done(err);
      });
    });

    step_generic_log_check('check create log', ents.one, function(result) {
      var ent = ents.one;
      should.deepEqual(result.rowCount, 2);
      check_log_create(result.rows[1],ent);
      should.deepEqual(result.rows[0].evtClass,'assign');
    });

    step('assign again', function create_assignment_resource(done) {
      update.assign_user_to_role(db, userpath, 'role2', 'note', done);
    });

    step('check assign again', function check_assign(done) {
      var query = "SELECT subject, role FROM wh_subject_to_roles WHERE subject = 'wh.update_assign' ORDER BY role ASC";
      quick_query(db, query, function(err, result) {
        if(err) {
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

    step('de-assign', function delete_assignment_resource(done) {
      update.remove_user_from_role(db, userpath, 'role', 'note', done);
    });

    step('check assign after 1 de-assign', function check_assign(done) {
      var query = "SELECT subject, role FROM wh_subject_to_roles WHERE subject = 'wh.update_assign' ORDER BY role ASC";
      quick_query(db, query, function(err, result) {
        if(err) {
          should.fail(err);
        }
        should.deepEqual(result.rowCount, 1);
        should.deepEqual(result.rows[0].subject, 'wh.update_assign');
        should.deepEqual(result.rows[0].role, 'role2');
        done(err);
      });
    });

    step('de-assign', function delete_assignment_resource(done) {
      update.remove_user_from_role(db, userpath, 'role2', 'note', done);
    });

    step('check assign after 2 de-assigns', function check_assign(done) {
      var query = "SELECT subject, role FROM wh_subject_to_roles WHERE subject = 'wh.update_assign' ORDER BY role ASC";
      quick_query(db, query, function(err, result) {
        if(err) {
          should.fail(err);
        }
        should.deepEqual(result.rowCount, 0);
        done(err);
      });
    });

    step_generic_delete('delete', ents.one, delMark);
  });

  after(function() {
    db.gunDatabase();
  });
});
