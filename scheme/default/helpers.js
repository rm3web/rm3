var SitePath = require ('sitepath');
var textblocks = require('textblocks')
var Protoset = require('../../lib/protoset');
var ActivityFeed = require('../../lib/activityfeed');
var IndexFeed = require('../../lib/indexfeed');
var TagHelpers = require('../../lib/taghelpers');
var SiteHelpers = require('../../lib/sitehelpers');
var SchemeHelpers = require('../../lib/schemehelpers');
var Pagination = require('../../lib/pagination');
var imageScale = require('../../lib/imagescale');
var path = require('path');
var React = require('react');
var ReactDOM = require('react-dom/server');
var requireCompiled = require('require-compiled').babelOptions({"presets": ["react", "es2015"]});  


var renderComponentToString = function renderComponent(reactDir, file, props) {
    var component = requireCompiled(path.resolve(path.join(reactDir, file)));
    var factory = React.createFactory(component);
    return ReactDOM.renderToString(factory(props))
}

exports = module.exports = function(dust, db, cache, query, reactDir) {

    ActivityFeed.installDust(dust, db, query);
    IndexFeed.installDust(dust, db, cache, query);
    TagHelpers.installDust(dust, db, query);
    SiteHelpers.installDust(dust, db, query);
    SchemeHelpers.installDust(dust, db, query);

    dust.filters.toDottedPath = function(value) {
      if (value instanceof SitePath) {
        return value.toDottedPath();
      }
      return value;
    }

    dust.filters.toISOString = function(value) {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    }

    dust.helpers.onlyThirdLevel = function(chunk, context, bodies, params) {
        var pageCurPath = context.get('path');
        var pathLength = pageCurPath.pathArray().length;
        if (pathLength > 2) {
            return chunk.render(bodies.block, context);
        } else {
            if (bodies["else"]) {
                return chunk.render(bodies["else"], context);
            }
        }
    }

    dust.helpers.linkIcon = function(chunk, context, bodies, params) {
        var size = context.resolve(params.size);
        if (!size) {
            size = 'sq';
        }
        var svgicon = context.get('meta.rm3\:icon.' + size + '.svg');
        var imgicon = context.get('meta.rm3\:icon.' + size + '.alt');
        var height = context.get('meta.rm3\:icon.' + size + '.height');
        var width = context.get('meta.rm3\:icon.' + size + '.width');
        if (svgicon) {
            return chunk.write('<link href="' + svgicon + '" rel="icon" />' +
                '<media:thumbnail url="' + svgicon + '" height="' + height + 
                '" width="' + width + '" xmlns:media="http://search.yahoo.com/mrss/" />'
                )
        } else {
            return chunk.write('<link href="' + imgicon + '" rel="icon" />' +
                '<media:thumbnail url="' + imgicon + '" height="' + height + 
                '" width="' + width + '" xmlns:media="http://search.yahoo.com/mrss/" />'
                )
        }
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
                '" type="image/svg+xml"><img srcset="' + imgicon +
                '"  height="' + height + '" width="' + width + '" border="0" /></picture>');
        } else {
            return chunk.write('<img src="' + imgicon + '"  height="' + height + 
                '" width="' + width + '" border="0" />')
        }
    }

    dust.helpers.thumbnail = function(chunk, context, bodies, params) {
        var size = context.resolve(params.size);
        var svgicon = context.get('meta.rm3\:svg');
        var imgicon = context.get('meta.rm3\:srcset');
        var sizes = context.get('meta.rm3\:sizes');
        var scaleSize = imageScale.scaleBestFit(sizes.width, sizes.height, size);
        if (svgicon) {
            return chunk.write('<picture><source srcset="' + svgicon +
                '" type="image/svg+xml"><img srcset="' + imgicon +
                '"  height="' + scaleSize.height + '" width="' + scaleSize.width + '" border="0" /></picture>');
        } else {
            return chunk.write('<img srcset="' + imgicon + '"  height="' + scaleSize.height + 
                '" width="' + scaleSize.width + '" border="0" />')
        }
    }

    dust.helpers.ifLoginEnabled = function(chunk, context, bodies, params) {
        var site = context.get('site');
        if (site.loginVisible) {
            return chunk.render(bodies.block, context);
        } else {
            if (bodies["else"]) {
                return chunk.render(bodies["else"], context);
            }
        }
    }

    dust.helpers.siteUrlRoot = function(chunk, context, bodies, params) {
        var site = context.get('site');
        chunk.write(site.urlroot);
    }

    dust.helpers.textblock = function(chunk, context, bodies, params) {
        var textblock = context.resolve(params.field);
        var resolve = context.resolve(params.resolve);
        var ctx = context.get('ctx');
        var sitepath = context.get('path');
        var scheme = context.get('scheme');
        var site = context.get('site');
        var protoset = context.get('protoset');
        var security = context.get('security');
        var blobstores = context.get('blobstores');
        var state_ctx = {
            ctx: ctx,
            db: db,
            sitepath: sitepath,
            scheme: scheme,
            site: site,
            protoset: protoset,
            access: security,
            blobstores: blobstores
        }
        if (textblock) {
            return chunk.map(function(chunk) {
                textblocks.outputTextBlock(textblock, resolve, state_ctx ,function(err, output) {
                    chunk.write(output);
                    return chunk.end();
                })
            });
        } else {
            return chunk.end();
        }
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
        if (permission === 'edit' || permission === 'delete') {
            permission = 'post.' + permission;
        }

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

        if (permission && (permissions.hasOwnProperty(permission) || permissions.hasOwnProperty(permissionOr))) {
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

    dust.helpers.reactForm = function(chunk, context, bodies, params) {
        try {
            var file = context.resolve(params.component);
            var div = context.resolve(params.div);

            var scheme = context.get('scheme');

            var intlData = context.get('intl');
            var bundlePath = context.resolve(params.bundle);
            var bundle = scheme.getResourcePath(bundlePath);

            var revisionId = context.get('meta.revisionId');
            var isDraft = context.get('isDraft');
            var formData = context.get('formData');
            var errors = context.get('errors');
            var proto = context.get('meta.proto');
            var section = context.get('section');

            props = {};

            for(var element in formData) {
                if (formData.hasOwnProperty(element)) {
                    props[element] = formData[element];
                }
            }

            props.locales = intlData.locales;
            props.messages = intlData.messages;
            props.revisionId = revisionId;
            props.isDraft = isDraft;
            props.errors = errors;
            props.proto = proto;
            props.section = section;

            var markup = renderComponentToString(reactDir, file, props);

            chunk.write('<div id="' + div + '">'+ markup+'</div>' +
                '<script src="' + bundle + '"></script>');
            return chunk;
        } catch (e) {
            chunk.setError(e);
            console.log(e);
            console.log(e.stack);
        }
    }
}