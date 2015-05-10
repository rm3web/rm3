var entity = require ('../../lib/entity');
var sitepath = require ('../../lib/sitepath');
var should = require('should');

describe('entity', function() {
  describe('#from_db', function() {
    var e;
    var queryresp = { 
      command: 'SELECT',
      rowCount: 1,
      oid: NaN,
      rows: 
      [{  path: 'wh',
          stub: false,
          entity_id: '96010990-36ad-11e4-863b-614e8d833a23',
          revision_id: '96010991-36ad-11e4-863b-614e8d833a23',
          revision_num: 1,
          proto: 'base',
          modified: new Date('Sun Sep 07 2014 09:39:50 GMT-0700 (PDT)'),
          created: new Date('Sun Sep 07 2014 09:39:50 GMT-0700 (PDT)'),
          summary: { title: 'blrg', abstract: 'some text goes here' },
          data: { posting: '<div>Test test</div>' },
          tags: { }
      }],
      fields: 
      [ { name: 'path', dataTypeID: 17555 },
        { name: 'stub', dataTypeID: 16 },
        { name: 'entity_id', dataTypeID: 2950 },
        { name: 'revision_id', dataTypeID: 2950 },
        { name: 'revision_num', dataTypeID: 23 },
        { name: 'proto', dataTypeID: 25 },
        { name: 'modified', dataTypeID: 1114 },
        { name: 'created', dataTypeID: 1114 },
        { name: 'summary', dataTypeID: 114 },
        { name: 'data', dataTypeID: 114 },
        { name: 'tags', dataTypeId: 114} ],
    rowAsArray: false };

    beforeEach(function() {
      e = new entity.Entity();
      e.from_db(queryresp, {});
    });

    it('should output correctly', function () {
      var e2 = new entity.Entity();
      e2._path = new sitepath(['wh']);
      e2._entity_id = '96010990-36ad-11e4-863b-614e8d833a23';
      e2._revision_id = '96010991-36ad-11e4-863b-614e8d833a23';
      e2._revision_num = 1;
      e2._proto = "base";
      e2._modified = new Date('Sun Sep 07 2014 09:39:50 GMT-0700 (PDT)');
      e2._created = new Date('Sun Sep 07 2014 09:39:50 GMT-0700 (PDT)');
      e2.data.posting = '<div>Test test</div>';
      e2.summary = 
      {"title": "blrg",
       "abstract": "some text goes here"};
      e2._tags = {};

      e.should.be.eql(e2);
    });

    it('should work with to_rec', function () {
      queryresp.rows[0].should.be.eql(e.to_rec());
    });
  });

  describe('#view', function() {
    it('should work', function () {
      var e = new entity.Entity();
      e._path = new sitepath(['wh']);
      e._entity_id = '96010990-36ad-11e4-863b-614e8d833a23';
      e._revision_id = '96010991-36ad-11e4-863b-614e8d833a23';
      e._revision_num = 1;
      e._proto = "base";
      e._modified = new Date('Sun Sep 07 2014 09:39:50 GMT-0700 (PDT)');
      e._created = new Date('Sun Sep 07 2014 09:39:50 GMT-0700 (PDT)');
      e.data.posting = '<div>Test test</div>';
      e.summary = 
      {"title": "blrg",
       "abstract": "some text goes here"};

      var v = { 
      meta: 
       { entity_id: '96010990-36ad-11e4-863b-614e8d833a23',
         revision_id: '96010991-36ad-11e4-863b-614e8d833a23',
         revision_num: 1,
         proto: 'base',
         site_path: ['wh'],
         modified: new Date('Sun Sep 07 2014 09:39:50 GMT-0700 (PDT)'),
         created: new Date('Sun Sep 07 2014 09:39:50 GMT-0700 (PDT)') },
      summary: { title: 'blrg', abstract: 'some text goes here' },
      data: {posting: '<div>Test test</div>' },
      tags: {}};

      v.should.be.eql(e.view());
    });
  });
  
  describe('#path', function() {
    it('should work', function () {
      var e = new entity.Entity();
      e._path = new sitepath(['wh']);
      e._entity_id = '96010990-36ad-11e4-863b-614e8d833a23';
      e._revision_id = '96010991-36ad-11e4-863b-614e8d833a23';
      e._revision_num = 1;
      e._proto = "base";
      e._modified = new Date('Sun Sep 07 2014 09:39:50 GMT-0700 (PDT)');
      e._created = new Date('Sun Sep 07 2014 09:39:50 GMT-0700 (PDT)');
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
    
    it('should work', function () {
      e.data.posting = '<div>Test test</div>';
      e.summary = 
      {"title": "blrg",
       "abstract": "some text goes here"};

      var v = { 
      meta: 
       { entity_id: null,
         revision_id: null,
         revision_num: null,
         proto: 'base',
         site_path: ['wh'],
         modified: now,
         created: now},
      summary: { title: 'blrg', abstract: 'some text goes here' },
      data: {posting: '<div>Test test</div>' },
      tags: {}};

      v.should.be.eql(e.view());
    });
    it('should only run once', function () {
      (function(){
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
      it('should work', function () {
        var tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        now.should.be.equal(e.view().meta.modified);

        e.updateTimes(tomorrow);

        tomorrow.should.be.equal(e.view().meta.modified);
      });
    });

    describe('#addTag', function() {
      it('should work', function() {
        e.addTag(null,'sparklefish');
        e.addTag(undefined,'meowcat');
        e.addTag(new sitepath(['wh','ponies']),'twilight');
        e.addTag(new sitepath(['wh','ponies']),new sitepath(['wh','princess']));
        e.addTag('navigation','navbar');

        e._tags.should.have.property('plain');
        e._tags.should.have.property('navigation');
        e._tags.plain.should.have.property('sparklefish');
        e._tags.plain.should.have.property('meowcat');
        e._tags.navigation.should.have.property('navbar');
        e._tags.plain.meowcat.should.have.property('pred_class');
        e._tags.plain.meowcat.pred_class.should.equal('tag');
        e._tags.should.have.property('wh.ponies');
        e._tags['wh.ponies'].should.have.property('twilight');
        e._tags['wh.ponies'].twilight.pred_class.should.equal('tag');
        e._tags['wh.ponies'].should.have.property('wh.princess');
        e._tags['wh.ponies']['wh.princess'].pred_class.should.equal('ontag');
      });

      it('should reject invalid values', function() {
        (function(){
          e.addTag('stuff', 'base');
        }).should.throw('tag predicate must be a sitepath or \'navigation\'');
      });
    });

    describe('#removeTag', function() {
      it('should work', function() {
        e.addTag(null,'sparklecat');
        e.addTag(null,'meowfish');
        e.addTag(new sitepath(['wh','ponies']),'sparkle');
        e.addTag(new sitepath(['wh','ponies']),new sitepath(['wh','princess']));
        e.addTag('navigation','navbar');

        e.removeTag(null,'meowfish');
        e._tags.should.have.property('plain');
        e._tags.should.have.property('wh.ponies');
        e._tags.plain.should.have.property('sparklecat');
        e._tags.plain.should.not.have.property('meowcat');

        e.removeTag(null,'sparklecat');
        e._tags.should.not.have.property('plain');

        e.removeTag(new sitepath(['wh','ponies']),'sparkle');
        e._tags.should.have.property('wh.ponies');
        e.removeTag(new sitepath(['wh','ponies']),new sitepath(['wh','princess']));
        e._tags.should.not.have.property('wh.ponies');

        e.removeTag('navigation','navbar');
        e._tags.should.not.have.property('navigation');
      });

      it('should reject invalid values', function() {
        (function(){
          e.removeTag('stuff', 'base');
        }).should.throw('tag predicate must be a sitepath or \'navigation\'');
      });
    });
  });
});