var validator = require('validator');

function generateQueryType(name, value) {
  var str = '<select name="' + name + '" size="1">';
  if (value === "child") {
    str += '<option selected="selected" value="child">Query Children</option>';
  } else {
    str += '<option value="child">Query Children</option>';
  }
  if (value === "parents") {
    str += '<option selected="selected" value="parents">Query Parents</option>';
  } else {
    str += '<option value="parents">Query Parents</option>';
  }
  if (value === "dir") {
    str += '<option selected="selected" value="dir">Directory</option>';
  } else {
    str += '<option value="dir">Directory</option>';
  }
  str += '</select>';
  return str;
}

exports.generateSearchBlock = function generateSearchForm(name, block) {
  return '<div style="background: rgb(198, 198, 237); padding: 1em;"> \
    <input type="hidden" value="pragma" name="' + name +
    '[format]" />' + generateQueryType(name + '[query]',block.query) + '</div>';
};

exports.generateSelect = function generateSelect(name, format) {
  if (format === 'html') {
    return "<select name=\"" + name + "\" size=\"1\">\
<option selected=\"selected\" value=\"html\">HTML</option>\
<option value=\"markdown\">Markdown</option>\
</select>";
  } else {
    return "<select name=\"" + name + "\" size=\"1\">\
<option value=\"html\">HTML</option>\
<option selected=\"selected\" value=\"markdown\">Markdown</option>\
</select>";
  }
};

function selectContentArea(textblock) {
  if (textblock.format === 'html') {
    return validator.escape(textblock.htmltext);
  }
  return validator.escape(textblock.source);
}

exports.generateArea = function generateArea(name, contentArea) {
    return "<textarea rows=\"30\" class=\"pure-input-1\" name=\"" + name + "\" \
placeholder=\"Posting\">" + contentArea + "</textarea>";
};

exports.generateChildBlock = function generateOneBlock(prefix, num, source, format) {
  var textarea = exports.generateArea(prefix + '[blocks][' + num + '][source]', source);
  var formatselect = exports.generateSelect(prefix + '[blocks][' + num + '][format]', format);
  return (textarea + formatselect);
};

exports.generateEditor = function generateEditor(prefix, textblock) {
  if (textblock.format === 'section') {
    var hidden = '<input type="hidden" value="section" name="' + prefix +
    '[format]" /><input type="hidden" value="' +
    textblock.blocks.length + '" name="numblocks" />';

    var editors = textblock.blocks.reduce(function(prev, block, index) {      
      if (block.format === 'pragma') {
        var blockprefix = prefix + '[blocks][' + index + ']';
        return prev + exports.generateSearchBlock(blockprefix, block);
      } else {
        return prev + exports.generateChildBlock(prefix, index,
          selectContentArea(block), block.format);
      }
    },'');
    return hidden + editors;
  } else {
    return exports.generateArea(prefix + '[source]', selectContentArea(textblock)) +
    exports.generateSelect(prefix + '[format]', textblock.format);
  }
};