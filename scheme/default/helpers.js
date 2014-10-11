
exports = module.exports = function(dust) {
    dust.helpers.menu = function (chunk, ctx, bodies, params) {
        longstr = '<div class="l-box">';
        longstr = longstr + '<div class="pure-menu pure-menu-open">\
        <a class="pure-menu-heading">Admin</a>\
    <ul>';
        if (ctx.get('section') === 'edit') {
            longstr = longstr + '<li class="pure-menu-disabled"><a href="#">Edit</a></li>';
        } else {
            longstr = longstr + '<li><a href="edit.html">Edit</a></li>';
        }
        longstr = longstr + '<li><a href="#">Tag</a></li>\
    <li><a href="delete.html">Delete</a></li>\
    <li><a href="#">Move</a></li>\
    <li><a href="#" data-dropdown="#dropdown-1">Create &#x25BC;</a></li>\
    <li class="pure-menu-heading">User</li>\
    <li><a href="#">Log Out</a></li>\
    </ul>\
</div><div id="dropdown-1" class="dropdown dropdown-tip">\
    <ul class="dropdown-menu">\
        <li><a href="/$new/create.html?type=base">Default Node</a></li>\
    </ul>\
</div>';
        return chunk.write(longstr);
    }
}