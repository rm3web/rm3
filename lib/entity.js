var clone = require('clone');
var sitepath = require ('./sitepath');

var StubEntity = function () {
	this._data = {};
};

StubEntity.prototype.view = function() {
	return this._data;
};

var Entity = function() {
	this._path = undefined;
	this._entity_id = null;
	this._revision_id = null;
	this._revision_num = null;
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

Entity.prototype.addTag = function(tag_pred, tag_obj) {
	var pred, obj, pred_class;
	if (!tag_pred) {
		pred = 'plain';
	} else {
		if (tag_pred === 'navigation') {
			pred = 'navigation';
		} else {
			if (tag_pred instanceof sitepath) {
				pred = tag_pred.toDottedPath();
			} else {
				throw new Error('tag predicate must be a sitepath or \'navigation\'');
			}
		}
	}
	if (tag_obj instanceof sitepath) {
		obj = tag_obj.toDottedPath();
		pred_class = 'ontag';
	} else {
		obj = tag_obj;
		pred_class = 'tag';
	}
	if (!this._tags.hasOwnProperty(pred)) {
		this._tags[pred] = {};
	}
	this._tags[pred][obj] = {pred_class: pred_class};
};

Entity.prototype.removeTag = function(tag_pred, tag_obj) {
	var pred, obj;
	if (!tag_pred) {
		pred = 'plain';
	} else {
		if (tag_pred === 'navigation') {
			pred = 'navigation';
		} else {
			if (tag_pred instanceof sitepath) {
				pred = tag_pred.toDottedPath();
			} else {
				throw new Error('tag predicate must be a sitepath or \'navigation\'');
			}
		}
	}
	if (tag_obj instanceof sitepath) {
		obj = tag_obj.toDottedPath();
	} else {
		obj = tag_obj;
	}
	if (!this._tags.hasOwnProperty(pred)) {
		throw new Error('there is no tag predicate');
	}
	delete this._tags[pred][obj];
	if (Object.keys(this._tags[pred]).length === 0) {
		delete this._tags[pred];
	}
};

Entity.prototype.path = function () {
	return this._path;
};

Entity.prototype.clone = function() {
	return clone.clonePrototype(this);
};

Entity.prototype.from_db = function(queryresp, permissions) {
	var row = queryresp.rows[0];
	this._path = new sitepath();
	this._path.fromDottedPath(row.path);
	this._entity_id = row.entity_id;
	this._revision_id = row.revision_id;
	this._revision_num = row.revision_num;
	this._proto = row.proto;
	this._modified = row.modified;
	this._created = row.created;
	this.summary = row.summary;
	this.data = row.data;
	this._tags = row.tags;
	this.permissions = permissions;
};

Entity.prototype.to_rec = function() {
	var row = {};
	row.path = this._path.toDottedPath();
	row.entity_id = this._entity_id;
	row.revision_id = this._revision_id;
	row.revision_num = this._revision_num;
	row.proto = this._proto;
	row.stub = false;
	row.modified = this._modified;
	row.created = this._created;
	row.summary = clone(this.summary);
	row.data = clone(this.data);
	row.tags = clone(this._tags);
	return row;
};

Entity.prototype.from_log = function(logentry, permissions) {
	this._path = new sitepath();
	this._path.fromDottedPath(logentry.path);
	this._entity_id = logentry.entity_id;
	this._revision_id = logentry.revision_id;
	this._revision_num = logentry.revision_num;
	this._proto = logentry.data.to_data.proto;
	this._modified = new Date(logentry.data.to_data.modified);
	this._created = new Date(logentry.data.to_data.created);
	this.summary = logentry.data.to_data.summary;
	this.data = logentry.data.to_data.data;
	this._tags = logentry.data.to_data.tags;
	this.permissions = permissions;
};

Entity.prototype.to_log = function(entity_id) {
	return {
    path: this._path.toDottedPath(),
    stub: false,
    entity_id: entity_id,
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
		entity_id: this._entity_id,
		revision_id: this._revision_id,
		revision_num: this._revision_num,
		proto: this._proto,
		modified: this._modified,
		created: this._created,
		site_path: this._path.jsonSerialize()
	};
	lview.summary = clone(this.summary);
	lview.data = clone(this.data);
	lview.tags = clone(this._tags);
	return lview;
};

exports.StubEntity = StubEntity;
exports.Entity = Entity;