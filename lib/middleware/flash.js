module.exports = function flash(options) {

  return function(req, res, next) {
    req.flash = function(type, msg) {
      if (this.session === undefined) {
        throw Error('req.flash() requires sessions');
      }
      if (!this.session.flash) {
        this.session.flash = {};
      }
      this.session.flash[type] = msg;
    };

    req.getFlashMsgs = function(type) {
      if (this.session) {
        if (this.session.flash) {
          var arr = this.session.flash[type];
          delete this.session.flash[type];
          return arr || [];
        }
      }
    };
    next();
  };
};
