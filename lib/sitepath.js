var SitePath = function (path, partial) {
	this.path = path;
	this.partial = partial;
	this.page = null;
};

SitePath.prototype.jsonSerialize = function () {
	return this.path;
};

SitePath.prototype.toUrl = function (prefix, spl) {
	return prefix + this.path.slice(spl).join('/');
};

SitePath.prototype.toDottedPath = function () {
	return this.path.join('.');
};

SitePath.prototype.up = function () {
	return new SitePath(this.path.slice(0, -1));
};

SitePath.prototype.down = function (added) {
	return new SitePath(this.path.concat(added));
};

SitePath.prototype.fromDottedPath = function (url) {
	if (url === true) {
		this.path = [];
	} else {
		var pth = url.split('.');
		this.path = pth;
	}
};

SitePath.prototype.fromUrlSegment = function (url, prefix) {
	var arr = url.split('$'), pth;
	if (arr.length > 1) {
		this.partial = arr[1];
	} else {
		this.partial = undefined;
	}
	pth = url.split('/');
	pth = pth.filter(function (v, i, o) {
		if (v === '') {
			return false;
		} else {
			return true;
		}
	});
	var pagematch = /^\w+\.\w+$/;
	if (pagematch.test(pth.slice(-1))) {
		this.page = pth.pop();
		console.log(this.page);
	}
	pth.forEach(function (element, i, array) {
		var re = /^[A-Za-z0-9]\w*$/;
		if (!re.test(element)) {
			throw new Error('validation error');
		}
	});
	if (prefix === undefined) {
		this.path = [];
	} else {
		this.path = prefix;
	}
	this.path = this.path.concat(pth);
};

module.exports = exports = SitePath;
