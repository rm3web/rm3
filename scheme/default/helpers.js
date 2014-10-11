function gen_link(base, url, disabled, title) {
    if (disabled) {
        return '<li class="pure-menu-disabled"><a href="#">' + title + '</a></li>'
    } else {
        return '<li><a href="' + base + url + '">' + title +  '</a></li>'
    }
}

exports = module.exports = function(dust) {
    dust.helpers.menu = function (chunk, ctx, bodies, params) {
        var longstr = '<div class="l-box">';
        longstr = longstr + '<div class="pure-menu pure-menu-open">\
        <a class="pure-menu-heading">Admin</a>\
    <ul>';
        var baseurl = ctx.get('meta.site_path');
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
}