var validator = require('validator');

function generateSelect(name, textblock) {
  if (textblock.format === 'html') {
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
}

function generateArea(name, textblock) {
  if (textblock.format === 'html') {
    return "<textarea rows=\"30\" class=\"pure-input-1\" name=\"posting[source]\" \
placeholder=\"Posting\">" + validator.escape(textblock.htmltext) + "</textarea>";
  } else {
    return "<textarea rows=\"30\" class=\"pure-input-1\" name=\"posting[source]\" \
placeholder=\"Posting\">" + validator.escape(textblock.source) + "</textarea>";
  }
}

exports.generateEditor = function (prefix, textblock) {
  if (textblock.format === 'section') {
    return 'not imp,em';
  } else {
    return generateArea(prefix + '[source]', textblock) +
    generateSelect(prefix + '[format]', textblock);
  }
};