var validator = require('validator');

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
      var blockprefix = prefix + '[blocks][' + index + ']';
      return prev + exports.generateChildBlock(prefix, index,
        selectContentArea(block), block.format);
    },'');
    return hidden + editors;
  } else {
    return exports.generateArea(prefix + '[source]', selectContentArea(textblock)) +
    exports.generateSelect(prefix + '[format]', textblock.format);
  }
};