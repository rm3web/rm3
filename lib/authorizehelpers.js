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

  dust.helpers.userRoles = function(chunk, context, bodies, params) {
    var ctx = context.get('ctx');
    var userPath = context.get('path');
    return chunk.map(function(chunk) {
      var resp = query.permissionsForUser(db, ctx, userPath);
      var roles = {};
      resp.on('article', function(article) {
        if (!roles.hasOwnProperty(article.role)) {
          roles[article.role] = [];
        }
        roles[article.role].push({permission: article.permission,
          path: article.path});
      });
      resp.on('error', function(err) {
        chunk.end();
      });
      resp.on('end', function() {
        var idx = 0;
        for (var key in roles) {
          if (roles.hasOwnProperty(key)) {
            var article = roles[key];
            chunk.render(bodies.block, context.push(
              {role: key,
                data: article,
                '$idx': idx}));
            idx = idx + 1;
          }
        }
        chunk.end();
      });
    });
  };

  dust.helpers.availableRoles = function(chunk, context, bodies, params) {
    var ctx = context.get('ctx');
    return chunk.map(function(chunk) {
      var resp = query.listRoles(db, ctx);
      var idx = 0;
      resp.on('article', function(article) {
        chunk.render(bodies.block, context.push(
          {role: article.role,
            '$idx': idx}));
        idx = idx + 1;
      });
      resp.on('error', function(err) {
        chunk.end();
      });
      resp.on('end', function() {
        chunk.end();
      });
    });
  };
}

exports.installDust = installDust;
