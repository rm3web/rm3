var AuthorizeHelpers = require ('../../lib/authorizehelpers');
var should = require('chai').should();
var dust = require('dustjs-linkedin');
var dustRender = require('../lib/dustrender.js');
var SitePath = require ('sitepath');

AuthorizeHelpers.installDust(dust, {}, {});

describe('authorizehelpers', function() {
  describe('#requirePermission', function() {
    it('works when you have the permission', function(cb) {
      var template = "{@requirePermission permission=\"edit\"}works{/requirePermission}";
      var context = {
        permissions: {
          'post.edit': 'true'
        }
      };
      dustRender(dust, template, 'authorizehelpers.requirePermission.have', context, 'works', cb);
    });
    it('works when you don\'t', function(cb) {
      var template = "{@requirePermission permission=\"post.create\"}{:else}works{/requirePermission}";
      var context = {
        permissions: {
          'post.edit': 'true'
        }
      };
      dustRender(dust, template, 'authorizehelpers.requirePermission.else', context, 'works', cb);
    });
  });

  describe('#requirePermissionOr', function() {
    it('works when you have the permission', function(cb) {
      var template = "{@requirePermissionOr permission=\"comment.submit\" permissionOr=\"comment.create\"}works{/requirePermissionOr}";
      var context = {
        permissions: {
          'comment.submit': 'true'
        }
      };
      dustRender(dust, template, 'authorizehelpers.requirePermissionOr.1', context, 'works', cb);
    });
    it('works when you have the other permission', function(cb) {
      var template = "{@requirePermissionOr permission=\"comment.submit\" permissionOr=\"comment.create\"}works{/requirePermissionOr}";
      var context = {
        permissions: {
          'comment.create': 'true'
        }
      };
      dustRender(dust, template, 'authorizehelpers.requirePermissionOr.2', context, 'works', cb);
    });
    it('works when you have both permissions', function(cb) {
      var template = "{@requirePermissionOr permission=\"comment.submit\" permissionOr=\"comment.create\"}works{/requirePermissionOr}";
      var context = {
        permissions: {
          'comment.create': 'true',
          'comment.submit': 'true'
        }
      };
      dustRender(dust, template, 'authorizehelpers.requirePermissionOr.3', context, 'works', cb);
    });
    it('works when you don\'t', function(cb) {
      var template = "{@requirePermissionOr permission=\"comment.submit\" permissionOr=\"comment.create\"}{:else}works{/requirePermissionOr}";
      var context = {
        permissions: {
          'post.edit': 'true'
        }
      };
      dustRender(dust, template, 'authorizehelpers.requirePermissionOr.else', context, 'works', cb);
    });
  });

  describe('#requireUser', function() {
    it('works for a user', function(cb) {
      var template = "{@requireUser}works{:else}bro{/requireUser}";
      dustRender(dust, template, 'authorizehelpers.requireUser.present', {user: {}}, 'works', cb);
    });
    it('works for no user', function(cb) {
      var template = "{@requireUser}bro{:else}works{/requireUser}";
      dustRender(dust, template, 'authorizehelpers.requireUser.else', {}, 'works', cb);
    });
  });

  describe('#isThisUser', function() {
    it('works for this user', function(cb) {
      var context = {
        userPath: new SitePath('fm.cmo.wiur'),
        path: new SitePath('fm.cmo.wiur')
      };
      var template = "{@isThisUser}works{:else}bro{/isThisUser}";
      dustRender(dust, template, 'authorizehelpers.isThisUser.present', context, 'works', cb);
    });
    it('works for the wrong user', function(cb) {
      var context = {
        userPath: new SitePath('fm.cmo.wiur'),
        path: new SitePath('fm.cmo')
      };
      var template = "{@isThisUser}bro{:else}works{/isThisUser}";
      dustRender(dust, template, 'authorizehelpers.isThisUser.wrong', context, 'works', cb);
    });
    it('works for no user', function(cb) {
      var template = "{@isThisUser}bro{:else}works{/isThisUser}";
      dustRender(dust, template, 'authorizehelpers.isThisUser.else', {}, 'works', cb);
    });
  });
});
