var SitePath = require ('sitepath');
var textblocks = require('textblocks')
var Protoset = require('../../lib/protoset');
var ActivityFeed = require('../../lib/activityfeed');
var IndexFeed = require('../../lib/indexfeed');
var TagHelpers = require('../../lib/taghelpers');
var SiteHelpers = require('../../lib/sitehelpers');
var SchemeHelpers = require('../../lib/schemehelpers');
var Pagination = require('../../lib/pagination');

exports = module.exports = function(dust, db, query) {

    ActivityFeed.installDust(dust, db, query);
    IndexFeed.installDust(dust, db, query);
    TagHelpers.installDust(dust, db, query);
    SiteHelpers.installDust(dust, db, query);
    SchemeHelpers.installDust(dust, db, query);

    dust.filters.toDottedPath = function(value) {
      if (value instanceof SitePath) {
        return value.toDottedPath();
      }
      return value;
    }

    dust.helpers.icon = function(chunk, context, bodies, params) {
        var size = context.resolve(params.size);
        if (!size) {
            size = 'sq';
        }
        var svgicon = context.get('meta.rm3\:icon.' + size + '.svg');
        var imgicon = context.get('meta.rm3\:icon.' + size + '.alt');
        var height = context.get('meta.rm3\:icon.' + size + '.height');
        var width = context.get('meta.rm3\:icon.' + size + '.width');
        if (svgicon) {
            return chunk.write('<picture><source srcset="' + svgicon +
                '" type="image/svg+xml"><img srcset="' + imgicon + '" alt="' + imgicon +
                '"  height="' + height + '" width="' + width + '" border="0" /></picture>');
        } else {
            return chunk.write('<img src="' + imgicon + '"  height="' + height + 
                '" width="' + width + '" border="0" />')
        }
    }

    dust.helpers.textblock = function(chunk, context, bodies, params) {
        var textblock = context.resolve(params.field);
        return chunk.write(textblocks.outputTextBlock(textblock));
    }

    dust.helpers.sectionDisable = function(chunk, context, bodies, params) {
        var disabled = false;
        var sectionDisable = context.resolve(params.section);
        if (sectionDisable && context.get('section') === sectionDisable) {
            disabled = true;
        }
        if (disabled) {
            if (bodies["else"]) {
                return chunk.render(bodies["else"], context);
            }
        } else {
            return chunk.render(bodies.block, context);
        } 
    }

    dust.helpers.requirePermission = function(chunk, context, bodies, params) {
        var path = context.resolve(params.path);
        var permission = context.resolve(params.permission);

        var user = context.get('user');
        var permissions = context.get('permissions');

        if (permission && permissions.hasOwnProperty(permission)) {
            return chunk.render(bodies.block, context);
        } else {
            if (bodies["else"]) {
                return chunk.render(bodies["else"], context);
            }
        }
    }

    dust.helpers.requireUser = function(chunk, context, bodies, params) {
        var user = context.get('user');
        if (user) {
            return chunk.render(bodies.block, context);
        } else {
            if (bodies["else"]) {
                return chunk.render(bodies["else"], context);
            }
        }
    }

    dust.helpers.availableRoles = function(chunk, context, bodies, params) {
        var ctx = context.get('ctx');
        return chunk.map(function(chunk) {
            var resp = query.listRoles(db, ctx);
            var idx = 0;
            resp.on('article', function(article) {
                chunk.render(bodies.block, context.push(
                    {role: article.role,
                     '$idx': idx }));
                idx = idx + 1;
            });
            resp.on('error', function(err) {
                chunk.end();
            });
            resp.on('end', function() {
                chunk.end();
            });
        });
    }

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
                    path: article.path})
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
                            '$idx': idx }));
                        idx = idx + 1;
                    }
                }
                chunk.end();
            });
        });
    }

    dust.helpers.isThisUser = function(chunk, context, bodies, params) {
        var user = context.get('userPath');
        var path = context.get('path');
        if (user) {
            if(user.toDottedPath() == path.toDottedPath()) {
                return chunk.render(bodies.block, context);
            } else {
                return chunk.render(bodies["else"], context);
            }
        }
    }

    dust.helpers.isNotHead = function(chunk, context, bodies, params) {
        var curLogRev = context.get('curLogRev.revisionId');
        if (curLogRev) {
            return chunk.render(bodies.block, context);
        } else {
            return chunk.render(bodies["else"], context);
        }
    }

    dust.helpers.isDraft = function(chunk, context, bodies, params) {
        var curLogRev = context.get('curLogRev');
        if (curLogRev) {
            if (curLogRev.evtFinal) {
                return chunk.render(bodies["else"], context);
            } else {
                return chunk.render(bodies.block, context);
            }
        }
    }
}