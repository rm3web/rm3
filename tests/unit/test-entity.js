var entity = require ('../../lib/entity');
var sitepath = require ('sitepath');
var should = require('should');
var LinkedDataBox = require('linked-data-box').LinkedDataBox;

describe('stubEntity', function() {
  describe('#fromDb', function() {
    var e;
    var queryresp = {
      command: 'SELECT',
      rowCount: 1,
      oid: NaN,
      rows:
      [{path: 'wh',
          stub: true,
          entityId: '96010990-36ad-11e4-863b-614e8d833a23',
          revisionId: '96010991-36ad-11e4-863b-614e8d833a23',
          revisionNum: 1,
          hidden: false,
          modified: new Date('Sun Sep 07 2014 09:39:50 GMT-0700 (PDT)'),
          created: new Date('Sun Sep 07 2014 09:39:50 GMT-0700 (PDT)'),
          touched: new Date('Sun Sep 07 2014 09:39:50 GMT-0700 (PDT)'),
          summary: {title: 'blrg', abstract: 'some text goes here'},
          tags: {}
      }],
      fields:
      [{name: 'path', dataTypeID: 17555},
        {name: 'stub', dataTypeID: 16},
        {name: 'hidden', dataTypeID: 16},
        {name: 'entityId', dataTypeID: 2950},
        {name: 'revisionId', dataTypeID: 2950},
        {name: 'revisionNum', dataTypeID: 23},
        {name: 'modified', dataTypeID: 1114},
        {name: 'created', dataTypeID: 1114},
        {name: 'summary', dataTypeID: 114},
        {name: 'data', dataTypeID: 114}],
      rowAsArray: false};

    beforeEach(function() {
      e = new entity.StubEntity();
      e.fromDb(queryresp, {});
    });

    it('should output correctly', function() {
      var e2 = new entity.StubEntity();
      e2._path = new sitepath(['wh']);
      e2._entityId = '96010990-36ad-11e4-863b-614e8d833a23';
      e2._revisionId = '96010991-36ad-11e4-863b-614e8d833a23';
      e2._revisionNum = 1;
      e2._modified = new Date('Sun Sep 07 2014 09:39:50 GMT-0700 (PDT)');
      e2._created = new Date('Sun Sep 07 2014 09:39:50 GMT-0700 (PDT)');
      e2._touched = new Date('Sun Sep 07 2014 09:39:50 GMT-0700 (PDT)');
      e2.summary =
      {"title": "blrg",
       "abstract": "some text goes here"};

      e.should.be.eql(e2);
    });
  });

  describe('#view', function() {
    it('should work', function() {
      var e = new entity.StubEntity();
      e._path = new sitepath(['wh']);
      e._entityId = '96010990-36ad-11e4-863b-614e8d833a23';
      e._revisionId = '96010991-36ad-11e4-863b-614e8d833a23';
      e._revisionNum = 1;
      e._modified = new Date('Sun Sep 07 2014 09:39:50 GMT-0700 (PDT)');
      e._created = new Date('Sun Sep 07 2014 09:39:50 GMT-0700 (PDT)');
      e._touched = new Date('Sun Sep 07 2014 09:39:50 GMT-0700 (PDT)');
      e.summary =
      {"title": "blrg",
       "abstract": "some text goes here"};

      var v = {
        meta:
       {entityId: '96010990-36ad-11e4-863b-614e8d833a23',
         revisionId: '96010991-36ad-11e4-863b-614e8d833a23',
         revisionNum: 1,
         sitePath: ['wh'],
         modified: new Date('Sun Sep 07 2014 09:39:50 GMT-0700 (PDT)'),
         created: new Date('Sun Sep 07 2014 09:39:50 GMT-0700 (PDT)'),
         touched: new Date('Sun Sep 07 2014 09:39:50 GMT-0700 (PDT)')},
        summary: {title: 'blrg', abstract: 'some text goes here'},
        permissions: {}};

      e.view().should.have.properties(v);
    });
  });

  describe('#path', function() {
    it('should work', function() {
      var e = new entity.StubEntity();
      e._path = new sitepath(['wh']);
      e._entityId = '96010990-36ad-11e4-863b-614e8d833a23';
      e._revisionId = '96010991-36ad-11e4-863b-614e8d833a23';
      e._revisionNum = 1;
      e._modified = new Date('Sun Sep 07 2014 09:39:50 GMT-0700 (PDT)');
      e._created = new Date('Sun Sep 07 2014 09:39:50 GMT-0700 (PDT)');
      e._touched = new Date('Sun Sep 07 2014 09:39:50 GMT-0700 (PDT)');
      e.summary =
      {"title": "blrg",
       "abstract": "some text goes here"};

      e.path().should.be.eql(new sitepath(['wh']));
    });
  });
});

describe('entity', function() {
  describe('#fromDb', function() {
    var e;
    var queryresp = {
      command: 'SELECT',
      rowCount: 1,
      oid: NaN,
      rows:
      [{path: 'wh',
          stub: false,
          entityId: '96010990-36ad-11e4-863b-614e8d833a23',
          revisionId: '96010991-36ad-11e4-863b-614e8d833a23',
          revisionNum: 1,
          proto: 'base',
          hidden: false,
          modified: new Date('Sun Sep 07 2014 09:39:50 GMT-0700 (PDT)'),
          created: new Date('Sun Sep 07 2014 09:39:50 GMT-0700 (PDT)'),
          touched: new Date('Sun Sep 07 2014 09:39:50 GMT-0700 (PDT)'),
          summary: {title: 'blrg', abstract: 'some text goes here'},
          data: {posting: '<div>Test test</div>'},
          tags: {}
      }],
      fields:
      [{name: 'path', dataTypeID: 17555},
        {name: 'stub', dataTypeID: 16},
        {name: 'hidden', dataTypeID: 16},
        {name: 'entityId', dataTypeID: 2950},
        {name: 'revisionId', dataTypeID: 2950},
        {name: 'revisionNum', dataTypeID: 23},
        {name: 'proto', dataTypeID: 25},
        {name: 'modified', dataTypeID: 1114},
        {name: 'created', dataTypeID: 1114},
        {name: 'touched', dataTypeID: 1114},
        {name: 'summary', dataTypeID: 114},
        {name: 'data', dataTypeID: 114},
        {name: 'tags', dataTypeId: 114}],
      rowAsArray: false};

    beforeEach(function() {
      e = new entity.Entity();
      e.fromDb(queryresp, {});
    });

    it('should output correctly', function() {
      var e2 = new entity.Entity();
      e2._path = new sitepath(['wh']);
      e2._entityId = '96010990-36ad-11e4-863b-614e8d833a23';
      e2._revisionId = '96010991-36ad-11e4-863b-614e8d833a23';
      e2._revisionNum = 1;
      e2._proto = "base";
      e2._hidden = false;
      e2._modified = new Date('Sun Sep 07 2014 09:39:50 GMT-0700 (PDT)');
      e2._created = new Date('Sun Sep 07 2014 09:39:50 GMT-0700 (PDT)');
      e2._touched = new Date('Sun Sep 07 2014 09:39:50 GMT-0700 (PDT)');
      e2.data.posting = '<div>Test test</div>';
      e2.summary =
      {"title": "blrg",
       "abstract": "some text goes here"};
      e2._tags = new LinkedDataBox();

      e.should.be.eql(e2);
    });

    it('should work with toRec', function() {
      queryresp.rows[0].should.be.eql(e.toRec());
    });
  });

  describe('#view', function() {
    it('should work', function() {
      var e = new entity.Entity();
      e._path = new sitepath(['wh']);
      e._entityId = '96010990-36ad-11e4-863b-614e8d833a23';
      e._revisionId = '96010991-36ad-11e4-863b-614e8d833a23';
      e._revisionNum = 1;
      e._proto = "base";
      e._hidden = false;
      e._modified = new Date('Sun Sep 07 2014 09:39:50 GMT-0700 (PDT)');
      e._created = new Date('Sun Sep 07 2014 09:39:50 GMT-0700 (PDT)');
      e._touched = new Date('Sun Sep 07 2014 09:39:50 GMT-0700 (PDT)');
      e.data.posting = '<div>Test test</div>';
      e.summary =
      {"title": "blrg",
       "abstract": "some text goes here"};

      var v = {
        meta:
       {entityId: '96010990-36ad-11e4-863b-614e8d833a23',
         revisionId: '96010991-36ad-11e4-863b-614e8d833a23',
         revisionNum: 1,
         proto: 'base',
         sitePath: ['wh'],
         hidden: false,
         modified: new Date('Sun Sep 07 2014 09:39:50 GMT-0700 (PDT)'),
         created: new Date('Sun Sep 07 2014 09:39:50 GMT-0700 (PDT)'),
         touched: new Date('Sun Sep 07 2014 09:39:50 GMT-0700 (PDT)')},
        summary: {title: 'blrg', abstract: 'some text goes here'},
        data: {posting: '<div>Test test</div>'},
        permissions: {}};

      e.view().should.have.properties(v);
    });
  });

  describe('#path', function() {
    it('should work', function() {
      var e = new entity.Entity();
      e._path = new sitepath(['wh']);
      e._entityId = '96010990-36ad-11e4-863b-614e8d833a23';
      e._revisionId = '96010991-36ad-11e4-863b-614e8d833a23';
      e._revisionNum = 1;
      e._proto = "base";
      e._modified = new Date('Sun Sep 07 2014 09:39:50 GMT-0700 (PDT)');
      e._created = new Date('Sun Sep 07 2014 09:39:50 GMT-0700 (PDT)');
      e._touched = new Date('Sun Sep 07 2014 09:39:50 GMT-0700 (PDT)');
      e.data.posting = '<div>Test test</div>';
      e.summary =
      {"title": "blrg",
       "abstract": "some text goes here"};

      e.path().should.be.eql(new sitepath(['wh']));
    });
  });

  describe('#new', function() {
    var now = new Date();
    var e;
    beforeEach(function() {
      e = new entity.Entity();
      e.createNew(new sitepath(['wh']), 'base', now);
    });

    it('should work', function() {
      e.data.posting = '<div>Test test</div>';
      e.summary =
      {"title": "blrg",
       "abstract": "some text goes here"};

      var v = {
        meta:
       {entityId: null,
         revisionId: null,
         revisionNum: null,
         proto: 'base',
         hidden: false,
         sitePath: ['wh'],
         modified: now,
         created: now,
         touched: now},
        summary: {title: 'blrg', abstract: 'some text goes here'},
        data: {posting: '<div>Test test</div>'},
        permissions: {}};

      e.view().should.have.properties(v);
    });
    it('should only run once', function() {
      (function() {
        e.createNew(new sitepath(['wh']), 'base');
      }).should.throw('can\'t set path');
    });
  });

  context('updates', function() {
    var e, now;
    beforeEach(function() {
      e = new entity.Entity();
      now = new Date();
      e.createNew(new sitepath(['wh']), 'base', now);
      e.data.posting = '<div>Test test</div>';
      e.summary =
      {"title": "blrg",
       "abstract": "some text goes here"};
    });

    describe('#updateTimes', function() {
      it('should work', function() {
        var tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        now.should.be.equal(e.view().meta.modified);
        now.should.be.equal(e.view().meta.touched);

        e.updateTimes(tomorrow);

        tomorrow.should.be.equal(e.view().meta.modified);
        tomorrow.should.be.equal(e.view().meta.touched);
      });
    });

    describe('#addTag', function() {
      it('should work', function() {
        e.addTag(null, 'sparklefish');
        e.addTag(undefined, 'meowcat');
        e.addTag(new sitepath(['wh', 'ponies']), 'twilight');
        e.addTag(new sitepath(['wh', 'ponies']), new sitepath(['wh', 'princess']));
        e.addTag('navigation', 'navbar');

        e._tags.hasTag('plain', {"@id": "sparklefish", "objClass": "tag"}).should.equal(true);
        e._tags.hasTag('plain', {"@id": "meowcat", "objClass": "tag"}).should.equal(true);
        e._tags.hasTag('navigation', {"@id": "navbar", "objClass": "tag"}).should.equal(true);

        e._tags.hasTag('wh.ponies', {'@id': 'twilight', 'objClass': 'tag'}).should.equal(true);
        e._tags.hasTag('wh.ponies', {'@id': 'wh.princess', 'objClass': 'ontag'}).should.equal(true);
      });

      it('should reject invalid values', function() {
        (function() {
          e.addTag('stuff', 'base');
        }).should.throw('tag predicate must be a sitepath or \'navigation\'');
      });
    });

    describe('#removeTag', function() {
      it('should work', function() {
        e.addTag(null, 'sparklecat');
        e.addTag(null, 'meowfish');
        e.addTag(new sitepath(['wh', 'ponies']), 'sparkle');
        e.addTag(new sitepath(['wh', 'ponies']), new sitepath(['wh', 'princess']));
        e.addTag('navigation', 'navbar');

        e.removeTag(null, 'meowfish');

        e._tags.hasTag('plain', {"@id": "sparklecat", "objClass": "tag"}).should.equal(true);
        e._tags.hasTag('navigation', {"@id": "navbar", "objClass": "tag"}).should.equal(true);

        e._tags.hasTag('wh.ponies', {'@id': 'sparkle', 'objClass': 'tag'}).should.equal(true);
        e._tags.hasTag('wh.ponies', {'@id': 'wh.princess', 'objClass': 'ontag'}).should.equal(true);

        e._tags.hasTag('plain', {"@id": "meowcat", "objClass": "tag"}).should.equal(false);

        e.removeTag(null, 'sparklecat');
        e._tags.hasTag('plain', {"@id": "sparklecat", "objClass": "tag"}).should.equal(false);

        e.removeTag(new sitepath(['wh', 'ponies']), 'sparkle');
        e._tags.hasTag('wh.ponies', {'@id': 'sparkle', 'objClass': 'tag'}).should.equal(false);

        e.removeTag(new sitepath(['wh', 'ponies']), new sitepath(['wh', 'princess']));
        e._tags.hasTag('wh.ponies', {'@id': 'wh.princess', 'objClass': 'ontag'}).should.equal(false);

        e.removeTag('navigation', 'navbar');
        e._tags.hasTag('navigation', {"@id": "navbar", "objClass": "tag"}).should.equal(false);
      });

      it('should reject invalid values', function() {
        (function() {
          e.removeTag('stuff', 'base');
        }).should.throw('tag predicate must be a sitepath or \'navigation\'');
      });
    });
  });
});
