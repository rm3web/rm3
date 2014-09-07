var clone = require('clone');

var StubEntity = function () {
	this._data = {};
};

StubEntity.prototype.view = function() {
	return this._data;
}

var Entity = function() {
	this._path = {};
	this._entity_id = null;
	this._revision_id = null;
	this._revision_num = null;
	this._proto = null;
	this._modified = null;
	this._created = null;
	this.summary = {};
	this.data = {};
};

Entity.prototype.view = function() {
	lview = {};
	lview.meta = {
		entity_id: this._entity_id,
		revision_id: this._revision_id,
		revision_num: this._revision_num,
		proto: this._proto,
		modified: this._modified,
		created: this._created
	}
	lview.summary = clone(this.summary);
	for (var key in this.data) {
		if (this.data.hasOwnProperty(key) && !lview.hasOwnProperty(key)) {
			lview[key] = clone(this.data[key])
		}
	}
	return lview;
}

exports.StubEntity = StubEntity;
exports.Entity = Entity;