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
};

Entity.prototype.updateTimes = function(now) {
	this._modified = now;
}

Entity.prototype.createNew = function(path, proto) {
	if (this._path) {
		throw new Error('can\'t set path');
	} else {
		this._path = path;
		this._proto = proto;
	}
};

Entity.prototype.clone = function() {
	return clone.clonePrototype(this);
};

Entity.prototype.from_db = function(queryresp) {
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
};

Entity.prototype.from_log = function(logentry) {
	this._path = new sitepath();
	this._path.fromDottedPath(logentry.path);
	this._entity_id = logentry.entity_id;
	this._revision_id = logentry.revision_id;
	this._revision_num = logentry.revision_num;
	this._proto = logentry.data.to_data.proto;
	this._modified = logentry.data.to_data.modified;
	this._created = logentry.data.to_data.created;
	this.summary = logentry.data.to_data.summary;
	this.data = logentry.data.to_data.data;
};

Entity.prototype.to_log = function(entity_id, modified, created) {
	return {
    path: this._path.toDottedPath(),
    stub: false,
    entity_id: entity_id,
    proto: this._proto,
    modified: modified,
    created: created,
    summary: this.summary,
    data: this.data
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
	for (var key in this.data) {
		if (this.data.hasOwnProperty(key) && !lview.hasOwnProperty(key)) {
			lview[key] = clone(this.data[key]);
		}
	}
	return lview;
};

exports.StubEntity = StubEntity;
exports.Entity = Entity;