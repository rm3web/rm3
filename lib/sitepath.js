var SitePath = function(path, partial) {
  this.path = path;
  this.partial = partial;
  this.page = null;
};

SitePath.prototype.leaf = function() {
  return this.path[this.path.length - 1];
};

SitePath.prototype.jsonSerialize = function() {
  return this.path;
};

SitePath.prototype.toUrl = function(prefix, spl) {
  var pathSegment = this.path.slice(spl);
  var str = prefix + pathSegment.join('/');
  if (pathSegment.length !== 0) {
    return str + '/';
  } else {
    return str;
  }
};

SitePath.prototype.toDottedPath = function() {
  return this.path.join('.');
};

SitePath.prototype.up = function() {
  return new SitePath(this.path.slice(0, -1));
};

SitePath.prototype.down = function(added) {
  return new SitePath(this.path.concat(added));
};

SitePath.prototype.fromDottedPath = function(url) {
  if (url === undefined) {
    this.path = [];
  } else {
    var pth = url.split('.');
    this.path = pth;
  }
};

SitePath.prototype.fromUrlSegment = function(url, prefix) {
  var arr = url.split('$'), pth;
  if (arr.length > 1) {
    this.partial = arr[1];
    url = arr[0];
  } else {
    this.partial = undefined;
  }
  pth = url.split('/');
  pth = pth.filter(function(v, i, o) {
    if (v === '') {
      return false;
    } else {
      return true;
    }
  });
  var pagematch = /^\w+\.\w+$/;
  if (pagematch.test(pth.slice(-1))) {
    this.page = pth.pop();
  }
  pth.forEach(function(element, i, array) {
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
