var $ = require('jquery-browserify');

var textblockUi = require('../../../lib/textblock_ui')

function textblock_create(prefix, num, source, format) {

  var block = textblockUi.generateArea(prefix + '[blocks][' + num + '][source]', source);
  var format = textblockUi.generateSelect(prefix + '[blocks][' + num + '][format]', format);

  return (block + format);
}

function convertSoloToSection(prefix) {
  var source = $("textarea[name='" + prefix + "\[source\]']").val();
  var format = $("select[name='" + prefix + "\[format\]']").val();
  var fieldprefix = prefix + '[blocks]'
  var block = textblockUi.generateArea(prefix + '[0][source]', source);
  var format = textblockUi.generateSelect(prefix + '[0][format]', format);

  var hidden = '<input type="hidden" value="section" name="posting[format]" /> \
  <input type="hidden" value="1" name="numblocks" />'
  
  $("#textblocks").replaceWith('<fieldset id="textblocks">' +
    hidden + block + format + textblock_create('posting', 1, '', 'html') + '</fieldset>');
}

$( "#addText" ).on( "click", function( event ) {
  if ($("input[name='posting\[format\]']").val() === 'section') {
    var num = parseInt($("input[name='numblocks']").val(),10) + 1;
    $("input[name='numblocks']").val(num)
    $("#textblocks").append( textblock_create('posting', num, '', 'html') );
  } else {
    convertSoloToSection('posting');
  }
  
  return false;
});