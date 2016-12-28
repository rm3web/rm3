/**
 * Install Dust helpers for authorization
 * @param {*} dust Dust instance
 * @param {*} db Database instance
 * @param {*} query Query instance
 */
function installDust(dust, db, query) {
  dust.helpers.requirePermission = function(chunk, context, bodies, params) {
    var permission = context.resolve(params.permission);
    if (permission === 'edit' || permission === 'delete') {
      permission = 'post.' + permission;
    }

    var permissions = context.get('permissions');

    if (permission && permissions.hasOwnProperty(permission)) {
      return chunk.render(bodies.block, context);
    } else {
      if (bodies.else) {
        return chunk.render(bodies.else, context);
      }
    }
  };

  dust.helpers.requirePermissionOr = function(chunk, context, bodies, params) {
    var path = context.resolve(params.path);
    var permission = context.resolve(params.permission);
    if (permission === 'edit' || permission === 'delete') {
      permission = 'post.' + permission;
    }

    var permissionOr = context.resolve(params.permissionOr);
    if (permissionOr === 'edit' || permissionOr === 'delete') {
      permissionOr = 'post.' + permissionOr;
    }

    var user = context.get('user');
    var permissions = context.get('permissions');

    if ((permission && permissionOr) && (permissions.hasOwnProperty(permission) || permissions.hasOwnProperty(permissionOr))) {
      return chunk.render(bodies.block, context);
    } else {
      if (bodies.else) {
        return chunk.render(bodies.else, context);
      }
    }
  };

  dust.helpers.requireUser = function(chunk, context, bodies, params) {
    var user = context.get('user');
    if (user) {
      return chunk.render(bodies.block, context);
    } else {
      if (bodies.else) {
        return chunk.render(bodies.else, context);
      }
    }
  };

  dust.helpers.isThisUser = function(chunk, context, bodies, params) {
    var user = context.get('userPath');
    var path = context.get('path');
    if (user) {
      if (user.toDottedPath() == path.toDottedPath()) {
        return chunk.render(bodies.block, context);
      } else {
        return chunk.render(bodies.else, context);
      }
    }
  };
}

exports.installDust = installDust;
