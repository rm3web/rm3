exports = module.exports = function(Scheme) {
	var scheme = new Scheme();
	return function path_map(req, res, next) {
		req.scheme = scheme;
		next();
	};
};