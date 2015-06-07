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