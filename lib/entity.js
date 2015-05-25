var clone = require('clone');
var sitepath = require ('./sitepath');

var StubEntity = function() {
  this._data = {};
};

StubEntity.prototype.view = function() {
  return this._data;
};

var Entity = function() {
  this._path = undefined;
  this._entityId = null;
  this._revisionId = null;
  this._revisionNum = null;
  this._proto = null;
  this._modified = null;
  this._created = null;
  this.summary = {};
  this.data = {};
  this._tags = {};
  this.permissions = {};
};

Entity.prototype.updateTimes = function(now) {
  this._modified = now;
};

Entity.prototype.createNew = function(path, proto, now) {
  if (this._path) {
    throw new Error('can\'t set path');
  } else {
    this._path = path;
    this._proto = proto;
    this._modified = now;
    this._created = now;
  }
};

Entity.prototype.addTag = function(tagPred, tagObj) {
  var pred, obj, predClass;
  if (!tagPred) {
    pred = 'plain';
  } else {
    if (tagPred === 'navigation') {
      pred = 'navigation';
    } else {
      if (tagPred instanceof sitepath) {
        pred = tagPred.toDottedPath();
      } else {
        throw new Error('tag predicate must be a sitepath or \'navigation\'');
      }
    }
  }
  if (tagObj instanceof sitepath) {
    obj = tagObj.toDottedPath();
    predClass = 'ontag';
  } else {
    obj = tagObj;
    predClass = 'tag';
  }
  if (!this._tags.hasOwnProperty(pred)) {
    this._tags[pred] = {};
  }
  this._tags[pred][obj] = {predClass: predClass};
};

Entity.prototype.removeTag = function(tagPred, tagObj) {
  var pred, obj;
  if (!tagPred) {
    pred = 'plain';
  } else {
    if (tagPred === 'navigation') {
      pred = 'navigation';
    } else {
      if (tagPred instanceof sitepath) {
        pred = tagPred.toDottedPath();
      } else {
        throw new Error('tag predicate must be a sitepath or \'navigation\'');
      }
    }
  }
  if (tagObj instanceof sitepath) {
    obj = tagObj.toDottedPath();
  } else {
    obj = tagObj;
  }
  if (!this._tags.hasOwnProperty(pred)) {
    throw new Error('there is no tag predicate');
  }
  delete this._tags[pred][obj];
  if (Object.keys(this._tags[pred]).length === 0) {
    delete this._tags[pred];
  }
};

Entity.prototype.path = function() {
  return this._path;
};

Entity.prototype.clone = function() {
  return clone.clonePrototype(this);
};

Entity.prototype.fromDb = function(queryresp, permissions) {
  var row = queryresp.rows[0];
  this._path = new sitepath();
  this._path.fromDottedPath(row.path);
  this._entityId = row.entityId;
  this._revisionId = row.revisionId;
  this._revisionNum = row.revisionNum;
  this._proto = row.proto;
  this._modified = row.modified;
  this._created = row.created;
  this.summary = row.summary;
  this.data = row.data;
  this._tags = row.tags;
  this.permissions = permissions;
};

Entity.prototype.toRec = function() {
  var row = {};
  row.path = this._path.toDottedPath();
  row.entityId = this._entityId;
  row.revisionId = this._revisionId;
  row.revisionNum = this._revisionNum;
  row.proto = this._proto;
  row.stub = false;
  row.modified = this._modified;
  row.created = this._created;
  row.summary = clone(this.summary);
  row.data = clone(this.data);
  row.tags = clone(this._tags);
  return row;
};

Entity.prototype.fromLog = function(logentry, permissions) {
  this._path = new sitepath();
  this._path.fromDottedPath(logentry.path);
  this._entityId = logentry.entityId;
  this._revisionId = logentry.revisionId;
  this._revisionNum = logentry.revisionNum;
  this._proto = logentry.data.toData.proto;
  this._modified = new Date(logentry.data.toData.modified);
  this._created = new Date(logentry.data.toData.created);
  this.summary = logentry.data.toData.summary;
  this.data = logentry.data.toData.data;
  this._tags = logentry.data.toData.tags;
  this.permissions = permissions;
};

Entity.prototype.toLog = function(entityId) {
  return {
    path: this._path.toDottedPath(),
    stub: false,
    entityId: entityId,
    proto: this._proto,
    modified: this._modified,
    created: this._created,
    summary: this.summary,
    data: this.data,
    tags: this._tags
  };
};

Entity.prototype.view = function() {
  var lview = {};
  lview.meta = {
    entityId: this._entityId,
    revisionId: this._revisionId,
    revisionNum: this._revisionNum,
    proto: this._proto,
    modified: this._modified,
    created: this._created,
    sitePath: this._path.jsonSerialize()
  };
  lview.summary = clone(this.summary);
  lview.data = clone(this.data);
  lview.tags = clone(this._tags);
  lview.permissions = clone(this.permissions);
  return lview;
};

exports.StubEntity = StubEntity;
exports.Entity = Entity;
