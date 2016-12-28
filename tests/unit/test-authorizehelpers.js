var AuthorizeHelpers = require ('../../lib/authorizehelpers');
var should = require('chai').should();
var dust = require('dustjs-linkedin');
var dustRender = require('../lib/dustrender.js');

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
});
