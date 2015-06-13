var sitepath = require ('../../lib/sitepath');
var should = require('should');
var textblockUi = require('../../lib/textblock_ui');

describe('textblocks ui', function() {
  var tests = [
    {textblock: {format: 'html', htmltext: '<h1>goode</h1>'},
      expected: "<textarea rows=\"30\" class=\"pure-input-1\" name=\"posting[source]\" \
placeholder=\"Posting\">&lt;h1&gt;goode&lt;&#x2F;h1&gt;</textarea>\
<select name=\"posting[format]\" size=\"1\">\
<option selected=\"selected\" value=\"html\">HTML</option>\
<option value=\"markdown\">Markdown</option>\
</select>",
      desc: 'a single html section'
    },
    {textblock: {format: 'markdown', source: '# get'},
     expected: "<textarea rows=\"30\" class=\"pure-input-1\" name=\"posting[source]\" \
placeholder=\"Posting\"># get</textarea>\
<select name=\"posting[format]\" size=\"1\">\
<option value=\"html\">HTML</option>\
<option selected=\"selected\" value=\"markdown\">Markdown</option>\
</select>",
      desc: 'a single markdown section'
    },
    {textblock: {"blocks":
      [{source:"# humans make good pets",
        htmltext:"<h1>humans make good pets</h1>",
        format:"markdown"},
        {htmltext:"<strong>html section</strong>",
        format:"html"}],
      format:"section"},
      expected: '<input type="hidden" value="section" name="posting[format]" /><input type="hidden" value="2" name="numblocks" /><textarea rows="30" class="pure-input-1" name="posting[blocks][0][source]" placeholder="Posting"># humans make good pets</textarea><select name="posting[blocks][0][format]" size="1"><option value="html">HTML</option><option selected="selected" value="markdown">Markdown</option></select><textarea rows="30" class="pure-input-1" name="posting[blocks][1][source]" placeholder="Posting">&lt;strong&gt;html section&lt;&#x2F;strong&gt;</textarea><select name="posting[blocks][1][format]" size="1"><option selected="selected" value="html">HTML</option><option value="markdown">Markdown</option></select>',
      desc: 'a html and markdown section'
    },
    {textblock: {"blocks":
      [{source:"# humans make good pets",
        htmltext:"<h1>humans make good pets</h1>",
        format:"markdown"},
        {query:"parents",
        format:"pragma"}],
      format:"section"},
      expected: '<input type="hidden" value="section" name="posting[format]" /><input type="hidden" value="2" name="numblocks" /><textarea rows="30" class="pure-input-1" name="posting[blocks][0][source]" placeholder="Posting"># humans make good pets</textarea><select name="posting[blocks][0][format]" size="1"><option value="html">HTML</option><option selected="selected" value="markdown">Markdown</option></select><div style="background: rgb(198, 198, 237); padding: 1em;">     <input type="hidden" value="pragma" name="posting[blocks][1][format]" /><select name="posting[blocks][1][query]" size="1"><option value="child">Query Children</option><option selected="selected" value="parents">Query Parents</option><option value="dir">Directory</option></select></div>',
      desc: 'a html and pragma section'
    }
  ];

  tests.forEach(function(test) {
    // Need to name this better
    it('correctly builds an editor for ' + test.desc, function() {
      var tmp = textblockUi.generateEditor('posting', test.textblock);
      tmp.should.equal(test.expected);
    });
  });
});
