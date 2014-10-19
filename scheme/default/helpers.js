var SitePath = require ('../../lib/sitepath');

function gen_link(base, url, disabled, title) {
    if (disabled) {
        return '<li class="pure-menu-disabled"><a href="#">' + title + '</a></li>'
    } else {
        return '<li><a href="' + base + url + '">' + title +  '</a></li>'
    }
}

exports = module.exports = function(dust, db, query) {
    dust.helpers.menu = function (chunk, ctx, bodies, params) {
        var longstr = '<div class="l-box">';
        longstr = longstr + '<div class="pure-menu pure-menu-open">\
        <a class="pure-menu-heading">Admin</a>\
    <ul>';
        var sitepathquery = ctx.get('meta.site_path');
        var path = new SitePath(sitepathquery);
        var baseurl = path.toUrl('/',1),
        longstr = longstr + gen_link(baseurl, '/edit.html', ctx.get('section') === 'edit','Edit');
        longstr = longstr + gen_link('', '#', true, 'Tag');
        longstr = longstr + gen_link(baseurl, '/delete.html', true, 'Delete');
        longstr = longstr + gen_link(baseurl, '/move.html', true, 'Move');
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
            var resp = query.query(db, path,'child','entity',{},undefined,undefined);
            chunk.write('<ul>');
            resp.on('article', function(article) {
                console.log(article);
                chunk.write("<li><a href=\"" + article.path.toUrl('/', 1) + "\">");
                chunk.write(article.title + "</a></li>");
            });
            resp.on('error', function(err) {
                chunk.write('</ul>');
            });
            resp.on('end', function() {
                chunk.end();
            });
        })
    }
}