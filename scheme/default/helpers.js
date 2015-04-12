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
    dust.helpers.textblock_edit = function(chunk, ctx, bodies, params) {
        var textblock = dust.helpers.tap(params.field, chunk, ctx);
        var sr1 = '<textarea rows="30" class="pure-input-1" name="posting" placeholder="posting">'
        var sr2 = '</textarea>\
<select name="textblock_format" size="1">'
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

    dust.helpers.disabled_mode = function(chunk, ctx, bodies, params) {
        var section = ctx.get('section');
        var dis = dust.helpers.tap(params[section], chunk, ctx);
        if (dis) {
            return chunk.write('disabled')
        } else {
            return chunk.write('');
        }
    }

    dust.helpers.combo_form = function(chunk, ctx, bodies, params) {
        var section = ctx.get('section');
        var path = dust.helpers.tap(params[section], chunk, ctx);
        return chunk.write('<form id="draft" method="post" action="' + path + '" class="pure-form pure-form-stacked">');
    }

    dust.helpers.textblock = function(chunk, ctx, bodies, params) {
        var textblock = dust.helpers.tap(params.field, chunk, ctx);
        return chunk.write(textblocks.outputTextBlock(textblock));
    }

    dust.helpers.menu = function (chunk, ctx, bodies, params) {
        var longstr = '<div class="l-box">';
        longstr = longstr + '<div class="pure-menu pure-menu-open">\
        <a class="pure-menu-heading">Admin</a>\
    <ul>';
        var sitepathquery = ctx.get('meta.site_path');
        var path = new SitePath(sitepathquery);
        var baseurl = path.toUrl('/',1);
        if (baseurl === '/') {
            baseurl = '';
        }
        longstr = longstr + gen_link(baseurl, '/edit.html', ctx.get('section') === 'edit','Edit', false);
        longstr = longstr + gen_link('', '#', true, 'Tag', false);
        longstr = longstr + gen_link(baseurl, '/delete.html', false, 'Delete', true);
        longstr = longstr + gen_link(baseurl, '/move.html', true, 'Move', false);
        longstr = longstr + gen_link(baseurl, '/history.html', false, 'History', false);
        longstr = longstr + '<li><a href="#" data-dropdown="#dropdown-1">Create &#x25BC;</a></li>';
        longstr = longstr + '<li class="pure-menu-heading">User</li>'
        user = ctx.get('user');
        if (user) {
            longstr = longstr + '<li><a href="/$logout/">Log Out</a></li>'
        } else {
            longstr = longstr + '<li><a href="/$login/">Log In</a></li>'
        }
        longstr = longstr + '</ul></div><div id="dropdown-1" class="dropdown dropdown-tip">\
    <ul class="dropdown-menu">'
        protos = Protoset.list_protos();
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
    dust.helpers.basic_query = function (chunk, ctx, bodies, params) {
        return chunk.map(function(chunk) {
            var baseurl = ctx.get('meta.site_path');
            path = new SitePath(baseurl);
            var security = {context: 'STANDARD'};
            var user = ctx.get('user');
            if (user != undefined) {
                security.user = user.path();
            }
            var resp = query.query(db, security, path,'dir','entity',{},undefined,undefined);
            var body = bodies.block;
            var idx = 0;
            resp.on('article', function(article) {
                chunk.render(bodies.block, ctx.push(
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
    dust.helpers.history = function (chunk, ctx, bodies, params) {
        return chunk.map(function(chunk) {
            var baseurl = ctx.get('meta.site_path');
            var revision_id = ctx.get('meta.revision_id')
            path = new SitePath(baseurl);
            var security = {user: ctx.get('user'),
                            context: 'STANDARD'};
            var resp = query.query_history(db, security, path);
            var body = bodies.block;
            var idx = 0;
            resp.on('article', function(article) {
                chunk.render(bodies.block, ctx.push(
                    {path: article.path.toUrl('/',1),
                     current: revision_id === article.revision_id,
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
}