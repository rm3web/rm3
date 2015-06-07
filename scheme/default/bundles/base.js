var $ = require('jquery-browserify');

var textblockUi = require('../../../lib/textblock_ui')

function convertSoloToSection(prefix) {
  var source = $("textarea[name='" + prefix + "\[source\]']").val();
  var format = $("select[name='" + prefix + "\[format\]']").val();
  var block = textblockUi.generateArea(prefix + '[blocks][0][source]', source);
  var format = textblockUi.generateSelect(prefix + '[blocks][0][format]', format);

  var hidden = '<input type="hidden" value="section" name="posting[format]" /> \
  <input type="hidden" value="1" name="numblocks" />'
  
  $("#textblocks").replaceWith('<fieldset id="textblocks">' +
    hidden + block + format + textblockUi.generateChildBlock('posting', 1, '', 'html') + '</fieldset>');
}

$( "#addText" ).on( "click", function( event ) {
  if ($("input[name='posting\[format\]']").val() === 'section') {
    var num = parseInt($("input[name='numblocks']").val(),10) + 1;
    $("input[name='numblocks']").val(num)
    $("#textblocks").append( textblockUi.generateChildBlock('posting', num, '', 'html') );
  } else {
    convertSoloToSection('posting');
  }
  
  return false;
});