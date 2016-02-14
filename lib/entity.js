var clone = require('clone');
var sitepath = require ('sitepath');
var LinkedDataBox = require('linked-data-box').LinkedDataBox;

/**
* @overview These are mutable struct-like representations of an entity.
*
* Fetching entities and updating them back into the DB is intentionally
* contained within the `update` library.
* @title Entity
* @module entity
*/

var StubEntity = function() {
  this._data = {};
};

StubEntity.prototype.view = function() {
  return this._data;
};

/**
 * @class Entity
 * A piece of content in the database, mapped by a path.
 *
 * An Entity contains only information that is persisted to the database, not
 * the presentation of the data.
 */
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
  this._tags = new LinkedDataBox();
  this.permissions = {};
};

/**
 * Update the update time
 *
 * @param {Date} now The time to update.
 */
Entity.prototype.updateTimes = function(now) {
  this._modified = now;
};

/**
 * Initialize the entity's data structure
 *
 * @param {SitePath} path The path the object lives at.
 * @param {string} proto The proto to use to render.
 * @param {Date} now The time to set the creation and modified time to.
 */
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

Entity.prototype.tagsFromJSON = function(tags) {
  this._tags = new LinkedDataBox(tags);
};

/**
 * Add a tag
 *
 * @param {string|SitePath|null} tagPred The Predicate: null for a plain
 * 'flickr like' tag, `navigation` for a navigation-tag (such as adding
 * to the navbar), or a `SitePath` for a predicate page.
 * @param {string|SitePath} tagObj The Object: a string for a plain
 * 'flickr like' tag, or a `SitePath` for a object page.
 */
Entity.prototype.addTag = function(tagPred, tagObj) {
  var pred, obj, objClass;
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
    objClass = 'ontag';
  } else {
    obj = tagObj;
    objClass = 'tag';
  }
  if (!this._tags.hasOwnProperty(pred)) {
    this._tags[pred] = {};
  }
  this._tags.addTag(pred, {'@id': obj, objClass: objClass});
};

/**
 * Check if a tag exists, returns true if it does
 *
 * @param {string|SitePath|null} tagPred The Predicate: null for a plain
 * 'flickr like' tag, `navigation` for a navigation-tag (such as adding
 * to the navbar), or a `SitePath` for a predicate page.
 * @param {string|SitePath} tagObj The Object: a string for a plain
 * 'flickr like' tag, or a `SitePath` for a object page.
 */
Entity.prototype.hasTag = function(tagPred, tagObj) {
  var pred, obj, objClass;
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
    objClass = 'ontag';
  } else {
    obj = tagObj;
    objClass = 'tag';
  }
  return (this._tags.hasTag(pred,{'@id': obj, objClass: objClass}));
};

/**
 * Remove a tag
 *
 * @param {string|SitePath|null} tagPred The Predicate: null for a plain
 * 'flickr like' tag, `navigation` for a navigation-tag (such as adding
 * to the navbar), or a `SitePath` for a predicate page.
 * @param {string|SitePath} tagObj The Object: a string for a plain
 * 'flickr like' tag, or a `SitePath` for a object page.
 */
Entity.prototype.removeTag = function(tagPred, tagObj) {
  var pred, obj, objClass;
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
    objClass = 'ontag';
  } else {
    obj = tagObj;
    objClass = 'tag';
  }
  if (!this._tags.hasOwnProperty(pred)) {
    throw new Error('there is no tag predicate');
  }
  this._tags.deleteTag(pred, {'@id': obj, objClass: objClass});
};

/**
 * Fetch the path
 * @return {SitePath} The path for this entity.
 */
Entity.prototype.path = function() {
  return this._path;
};

/**
 * Clone this entity.
 *
 * While updating, you often need to provide the previous version of the
 * object.
 *
 * @return {Entity} A clone of the entity.
 */
Entity.prototype.clone = function() {
  return clone.clonePrototype(this);
};

/**
 * Load from a database record
 *
 * @param {Object} queryresp The query response.
 * @param {Object} permissions The entity permissions.
 */
Entity.prototype.fromDb = function(queryresp, permissions) {
  var row = queryresp.rows[0];
  this._path = new sitepath(row.path);
  this._entityId = row.entityId;
  this._revisionId = row.revisionId;
  this._revisionNum = row.revisionNum;
  this._proto = row.proto;
  this._modified = row.modified;
  this._created = row.created;
  this.summary = row.summary;
  this.data = row.data;
  this._tags = new LinkedDataBox(row.tags);
  this.permissions = permissions;
};

/**
 * Turn into a database record
 *
 * @return {Object} The records turned into an object, suitable for using in a query.
 */
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
  row.tags = this._tags.toJSON();
  return row;
};

/**
 * Load from a log entry
 *
 * @param {Object} logentry The log entry response
 * @param {Object} permissions The entity permissions
 */
Entity.prototype.fromLog = function(logentry, permissions) {
  this._path = new sitepath(logentry.path);
  this._entityId = logentry.entityId;
  this._revisionId = logentry.revisionId;
  this._revisionNum = logentry.revisionNum;
  this._proto = logentry.data.toData.proto;
  this._modified = new Date(logentry.data.toData.modified);
  this._created = new Date(logentry.data.toData.created);
  this.summary = logentry.data.toData.summary;
  this.data = logentry.data.toData.data;
  this._tags = new LinkedDataBox(logentry.data.toData.tags);
  this.permissions = permissions;
  this.curLogRev = logentry;
};

/**
 * Turn into a logentry record
 *
 * @return {Object} The records turned into an object, suitable for use as a logentry
 */
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
    tags: this._tags.toJSON()
  };
};

/**
 * Provides a reasonable JSON view, suitable for use with Dust or other similar
 * templating system, of the object.
 *
 * @return {Object} The JSON view of the object
 */
Entity.prototype.view = function() {
  var lview = {};
  lview.meta = {
    entityId: this._entityId,
    revisionId: this._revisionId,
    revisionNum: this._revisionNum,
    proto: this._proto,
    modified: this._modified,
    created: this._created,
  };
  if (this._path) {
    lview.meta.sitePath = this._path.pathArray();
  }
  lview.summary = clone(this.summary);
  lview.data = clone(this.data);
  lview.tags = clone(this._tags);
  lview.permissions = clone(this.permissions);
  return lview;
};

exports.StubEntity = StubEntity;
exports.Entity = Entity;
