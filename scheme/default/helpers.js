var SitePath = require ('../../lib/sitepath');
var textblocks = require('textblocks')
var Protoset = require('../../lib/protoset');

function gen_link(base, url, disabled, title, confirm) {
    if (disabled) {
        return '<li class="pure-menu-disabled"><a href="#">' + title + '</a></li>'
    } else {
        if (confirm) {
            return '<li><a href="'+ base + url + '" onclick="ConfirmChoice(\''
                    + base + url + '\'); return false;">' + title + '</a></li>';
        } else {
            return '<li><a href="' + base + url + '">' + title +  '</a></li>'
        }
    }
}

exports = module.exports = function(dust, db, query) {
    dust.helpers.textblock_edit = function(chunk, context, bodies, params) {
        var textblock = context.resolve(params.field);
        var sr1 = '<textarea rows="30" class="pure-input-1" name="posting" placeholder="posting">'
        var sr2 = '</textarea>\
<select name="textblockFormat" size="1">'
        var sr3a = '<option value="html" selected="true">HTML</option>\
<option value="markdown">Markdown</option>'
        var sr3b = '<option value="html">HTML</option>\
<option value="markdown" selected="true">Markdown</option>'
        var sr4 = '</select>'
        if (textblock.hasOwnProperty('source')) {
            return chunk.write(sr1 + textblock.source + sr2 + sr3b + sr4);
        } else {
            return chunk.write(sr1 + textblock.htmltext + sr2 + sr3a + sr4);
        }
    }

    dust.helpers.disabled_mode = function(chunk, context, bodies, params) {
        var section = context.get('section');
        var dis = context.resolve(params[section]);
        if (dis) {
            return chunk.write('disabled')
        } else {
            return chunk.write('');
        }
    }

    dust.helpers.combo_form = function(chunk, context, bodies, params) {
        var section = context.get('section');
        var path = context.resolve(params[section]);
        return chunk.write('<form id="draft" method="post" action="' + path + '" class="pure-form pure-form-stacked">');
    }

    dust.helpers.textblock = function(chunk, context, bodies, params) {
        var textblock = context.resolve(params.field);
        return chunk.write(textblocks.outputTextBlock(textblock));
    }

    dust.helpers.menu = function (chunk, context, bodies, params) {
        var longstr = '<div class="l-box">';
        longstr = longstr + '<div class="pure-menu pure-menu-open">\
        <a class="pure-menu-heading">Admin</a>\
    <ul>';
        var sitepathquery = context.get('meta.sitePath');
        var path = new SitePath(sitepathquery);
        var baseurl = path.toUrl('/',1);
        if (baseurl === '/') {
            baseurl = '';
        }
        longstr = longstr + gen_link(baseurl, '/edit.html', context.get('section') === 'edit','Edit', false);
        longstr = longstr + gen_link(baseurl, '/tag.html', context.get('section') === 'tag', 'Tag', false);
        longstr = longstr + gen_link(baseurl, '/delete.html', false, 'Delete', true);
        longstr = longstr + gen_link(baseurl, '/move.html', true, 'Move', false);
        longstr = longstr + gen_link(baseurl, '/history.html', false, 'History', false);
        longstr = longstr + '<li><a href="#" data-dropdown="#dropdown-1">Create &#x25BC;</a></li>';
        longstr = longstr + '<li class="pure-menu-heading">User</li>'
        user = context.get('user');
        if (user) {
            longstr = longstr + '<li><a href="/$logout/">Log Out</a></li>'
        } else {
            longstr = longstr + '<li><a href="/$login/">Log In</a></li>'
        }
        longstr = longstr + '</ul></div><div id="dropdown-1" class="dropdown dropdown-tip">\
    <ul class="dropdown-menu">'
        protos = Protoset.listProtos();
        for(var proto in protos) {
            if (protos.hasOwnProperty(proto)) {
                longstr = longstr + '<li><a href="/$new' + baseurl;
                longstr = longstr + '/create.html?type='+ proto +'">'
                longstr = longstr + protos[proto].desc + '</a></li>'
            }
        }
        longstr = longstr + '</ul>\
</div>';

        return chunk.write(longstr);
    }
    dust.helpers.basic_query = function (chunk, context, bodies, params) {
        return chunk.map(function(chunk) {
            var baseurl = context.get('meta.sitePath');
            path = new SitePath(baseurl);
            var security = {context: 'STANDARD'};
            var user = context.get('user');
            var ctx = context.get('ctx');
            if (user != undefined) {
                security.user = user.path();
            }
            var resp = query.query(db, ctx, security, path,'dir','entity',{},undefined,undefined);
            var body = bodies.block;
            var idx = 0;
            resp.on('article', function(article) {
                chunk.render(bodies.block, context.push(
                    {path: article.path.toUrl('/',1),
                     article: article,
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

    dust.helpers.navbar_query = function (chunk, context, bodies, params) {
        return chunk.map(function(chunk) {
            var baseurl = ['wh'];
            path = new SitePath(baseurl);
            var security = {context: 'STANDARD'};
            var user = context.get('user');
            if (user != undefined) {
                security.user = user.path();
            }
            var ctx = context.get('ctx');
            var resp = query.query(db, ctx, security, path,'dir','entity',{'navbar': true},undefined,undefined);
            var body = bodies.block;
            var idx = 0;
            resp.on('article', function(article) {
                chunk.render(bodies.block, context.push(
                    {path: article.path.toUrl('/',1),
                     article: article,
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

    dust.helpers.history = function (chunk, context, bodies, params) {
        return chunk.map(function(chunk) {
            var baseurl = context.get('meta.sitePath');
            var revisionId = context.get('meta.revisionId')
            path = new SitePath(baseurl);
            var security = {user: context.get('user'),
                            context: 'STANDARD'};
            var ctx = context.get('ctx');

            var resp = query.queryHistory(db, ctx, security, path);
            var body = bodies.block;

            var idx = 0;
            resp.on('article', function(article) {
                chunk.render(bodies.block, context.push(
                    {path: article.path.toUrl('/',1),
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
    dust.helpers.tags = function (chunk, context, bodies, params) {
        return chunk.map(function(chunk) {
            var tags = dust.helpers.tap(params.obj, chunk, context);
            for (var predKey in tags) {
                if (tags.hasOwnProperty(predKey)) {
                    var pred = tags[predKey];
                    for (var objKey in pred) {
                        var obj = pred[objKey];
                        var predClass = obj.predClass;
                        chunk.render(bodies.block, context.push(
                            {predKey: predKey,
                             objKey: objKey,
                             predClass: predClass, 
                             obj:obj}));
                    }
                }
            }
            chunk.end();
        })
    }
}