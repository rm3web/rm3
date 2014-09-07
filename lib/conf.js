var Conf = function () {
	this._data = {};
	this._data.endpoints = {};
	this._data.endpoints.postgres = 'postgresql://wirehead:rm3test@127.0.0.1/rm3test';
};

Conf.prototype.get_endpoint = function(endpoint) {
	return this._data.endpoints[endpoint];
};

module.exports = exports = new Conf();