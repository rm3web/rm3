var SitePath = require ('../../lib/sitepath');
var textblocks = require('textblocks')

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
        longstr = longstr + '<li><a href="#" data-dropdown="#dropdown-1">Create &#x25BC;</a></li>\
    <li class="pure-menu-heading">User</li>\
    <li><a href="#">Log Out</a></li>\
    </ul>\
</div><div id="dropdown-1" class="dropdown dropdown-tip">\
    <ul class="dropdown-menu">'
        longstr = longstr + '<li><a href="/$new' + baseurl;
        longstr = longstr + '/create.html?type=base">Default Node</a></li>'
        longstr = longstr + '</ul>\
</div>';
        return chunk.write(longstr);
    }
    dust.helpers.basic_query = function (chunk, ctx, bodies, params) {
        return chunk.map(function(chunk) {
            var baseurl = ctx.get('meta.site_path');
            path = new SitePath(baseurl);
            var resp = query.query(db, path,'dir','entity',{},undefined,undefined);
            chunk.write('<ul>');
            resp.on('article', function(article) {
                chunk.write("<li><a href=\"" + article.path.toUrl('/', 1) + "\">");
                chunk.write(article.title + "</a></li>");
            });
            resp.on('error', function(err) {
                chunk.write('</ul>');
                chunk.end();
            });
            resp.on('end', function() {
                chunk.write('</ul>');
                chunk.end();
            });
        })
    }
    dust.helpers.history = function (chunk, ctx, bodies, params) {
        return chunk.map(function(chunk) {
            var baseurl = ctx.get('meta.site_path');
            var revision_id = ctx.get('meta.revision_id')
            path = new SitePath(baseurl);
            var resp = query.query_history(db, path);
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