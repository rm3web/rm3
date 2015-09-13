var SitePath = require ('../../lib/sitepath');
var textblocks = require('textblocks')
var Protoset = require('../../lib/protoset');
var ActivityFeed = require('../../lib/activityfeed');
var IndexFeed = require('../../lib/indexfeed');

exports = module.exports = function(dust, db, query) {

    ActivityFeed.installDust(dust, db, query);
    IndexFeed.installDust(dust, db, query);

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
            return chunk.write('<img src="' + svgicon + '" alt="' + imgicon +
                '"  height="' + height + '" width="' + width + '" border="0" />')
        } else {
            return chunk.write('<img src="' + imgicon + '"  height="' + height + 
                '" width="' + width + '" border="0" />')
        }
    }

    dust.helpers.textblock = function(chunk, context, bodies, params) {
        var textblock = context.resolve(params.field);
        return chunk.write(textblocks.outputTextBlock(textblock));
    }

    dust.helpers.admin_link = function(chunk, context, bodies, params) {
        var longstr = '<ul>';
        var path = context.get('path');
        var site = context.get('site');
        var baseurl = site.sitePathToUrl(path);
        if (baseurl === '/') {
            baseurl = '';
        }
        var path = context.resolve(params.path);
        var confirm = context.resolve(params.confirm);
        var requiresAuth = context.resolve(params.requiresAuth);
        var permission = context.resolve(params.permission);
        var sectionDisable = context.resolve(params.sectionDisable);
        var disabled = context.resolve(params.disabled);

        var user = context.get('user');
        var permissions = context.get('permissions');

        if (sectionDisable && context.get('section') === sectionDisable) {
            disabled = true;
        }

        if (requiresAuth && !user) {
            disabled = true;
        }

        if (permission && !permissions.hasOwnProperty(permission)) {
            disabled = true;
        }

        if (disabled) {
            chunk.write('<li class="pure-menu-disabled"><a href="#">');
        } else {
            if (confirm) {
                chunk.write('<li><a href="'+ baseurl + path + '" onclick="ConfirmChoice(\''
                        + baseurl + path + '\'); return false;">');
            } else {
                chunk.write('<li><a href="' + baseurl + path + '">');
            }
        }
        chunk.render(bodies.block, context);
        return chunk.write('</a></li>');
    }

    dust.helpers.proto_menu = function (chunk, context, bodies, params) {
        var user = context.get('user');
        if (user) {
            chunk.write('<li><a href="#" data-dropdown="#dropdown-1">');
        } else {
            chunk.write('<li class="pure-menu-disabled"><a href="#">')
        }
        chunk.render(bodies.block, context);
        return chunk.write('</a></li>');
    }

    dust.helpers.requirePermission = function(chunk, context, bodies, params) {
        var path = context.resolve(params.path);
        var permission = context.resolve(params.permission);

        var user = context.get('user');
        var permissions = context.get('permissions');

        if (permission && permissions.hasOwnProperty(permission)) {
            return chunk.render(bodies.block, context);
        } else {
            return chunk.render(bodies["else"], context);
        }

        chunk.render(bodies.block, context);
    }

    dust.helpers.user_menu = function(chunk, context, bodies, params) {
        var longstr = ''
        var user = context.get('user');
        if (user) {
            longstr = longstr + '<li><a href="/$logout/">Log Out</a></li>'
        } else {
            longstr = longstr + '<li><a href="/$login/">Log In</a></li>'
        }
        return chunk.write(longstr);
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

    dust.helpers.proto_dropdown = function(chunk, context, bodies, params) {
        var path = context.get('path');
        var site = context.get('site');
        var baseurl = site.sitePathToUrl(path);
        var longstr = '<div id="dropdown-1" class="dropdown dropdown-tip">\
    <ul class="dropdown-menu">'
        protos = Protoset.listProtos();
        for(var proto in protos) {
            if (protos.hasOwnProperty(proto)) {
                longstr = longstr + '<li><a href="/$new' + baseurl;
                longstr = longstr + 'create.html?type='+ proto +'">'
                longstr = longstr + protos[proto].desc + '</a></li>'
            }
        }
        longstr = longstr + '</ul></div>';
        return chunk.write(longstr);
    }

    dust.helpers.history = function (chunk, context, bodies, params) {
        return chunk.map(function(chunk) {
            var site = context.get('site');
            var path = context.get('path');
            var security = context.get('security');
            var revisionId = context.get('meta.revisionId');
            var ctx = context.get('ctx');

            var resp = query.queryHistory(db, ctx, security, path);
            var body = bodies.block;

            var idx = 0;
            resp.on('article', function(article) {
                chunk.render(bodies.block, context.push(
                    {path: site.sitePathToUrl(article.path),
                     current: revisionId === article.revisionId,
                     rec: article,
                     '$idx': idx }));
                idx = idx + 1;
            });
            resp.on('error', function(err) {
                chunk.end();
            });
            resp.on('end', function() {
                chunk.end();
            });
        })
    }

    dust.helpers.activityFeed = function (chunk, context, bodies, params) {
        return chunk.map(function(chunk) {
            var pagePath = context.get('path');
            var security = context.get('security');
            var site = context.get('site');
            var userPath = undefined;
            var ctx = context.get('ctx');
            var baseurl = ['wh'];
            var path = new SitePath(baseurl);
            var pagination = {};
            var paginationKey = context.resolve(params.paginationKey);

            if (params.userPath) {
                var basePath = context.resolve(params.userPath);
                if (typeof basePath === 'string') {
                    userPath.fromDottedPath(basePath);
                } else {
                    userPath = basePath;
                }
            }

            if (params.basePath) {
                var basePath = context.resolve(params.basePath);
                if (typeof basePath === 'string') {
                    path.fromDottedPath(basePath);
                } else {
                    path = basePath;
                }
            }

            if (params.paginationLimit) {
                pagination.limit = parseInt(context.resolve(params.paginationLimit), 
                    10) + 1;
                pagination.start = 0;
            }
            if (pagePath.partial) {
                var partialKeyStart = pagePath.partial.indexOf(paginationKey)
                if (partialKeyStart !== -1) {
                    var memento = pagePath.partial[partialKeyStart + 1].split('_');
                    if (memento.length >= 3) {
                        pagination.start = parseInt(memento[0],10);
                        pagination.startDate = new Date(memento[1]);
                        pagination.startNum = parseInt(memento[2],10);
                        pagination.startId = memento[3];
                    } else {
                        pagination.start = parseInt(memento[0],10);
                    }
                }
            }
            var qr = query.queryActivity(db, ctx, security, path, 'child', userPath, pagination);
            var body = bodies.block;

            if (bodies.begin){
                chunk.render(bodies.begin, context);
            }
            resp = ActivityFeed.logToActivityFeed(qr, site);
            var idx = 0;
            var lastArt = {};
            var more = false;
            resp.on('article', function(article) {
                if (idx + 1 === pagination.limit) {
                    more = true;
                } else {
                    chunk.render(bodies.block, context.push(
                        {rec: article,
                         '$idx': idx }));
                    idx = idx + 1;
                    lastArt = article;
                }
            });
            resp.on('error', function(err) {
                chunk.end();
            });
            resp.on('end', function() {
                if (bodies.end){
                    chunk.render(bodies.end, context);
                }
                if (paginationKey) {
                    if (more) {
                        var pKey = paginationKey + '/' + 
                            (pagination.start + pagination.limit - 1) + "_" + 
                            lastArt.endTime.toISOString() + "_" + 
                            lastArt["rm3:revisionNum"] + "_" + 
                            lastArt["rm3:revisionId"];
                        chunk.write('<a href="'+ site.sitePathToUrl(pagePath) +
                            '$/' + pKey + '">next</a>');
                    }
                }
                chunk.end();
            });
        })
    }

    dust.helpers.predTag = function(chunk, context, bodies, params) {
        var predClass = context.resolve(params.predClass);
        var predKey = context.resolve(params.predKey);
        if (predKey === 'tag' && predKey === 'plain') {
            chunk.write('');
        } else {
            chunk.write(predKey + ":" +predClass)
        }
    }
    dust.helpers.tags = function (chunk, context, bodies, params) {
        return chunk.map(function(chunk) {
            var tags = dust.helpers.tap(params.obj, chunk, context);
            var showNav = context.resolve(params.showNav);
            for (var predKey in tags) {
                if (tags.hasOwnProperty(predKey)) {
                    var pred = tags[predKey];
                    for (var objKey in pred) {
                        var obj = pred[objKey];
                        var predClass = obj.predClass;
                        var render = true;
                        if(showNav) {
                            if (predClass === 'tag' && predKey === 'navigation') {
                                render = false;
                            }
                        }
                        if(render) {
                            chunk.render(bodies.block, context.push(
                                {predKey: predKey,
                                 objKey: objKey,
                                 predClass: predClass, 
                                 obj:obj}));
                        }
                    }
                }
            }
            chunk.end();
        })
    }
}