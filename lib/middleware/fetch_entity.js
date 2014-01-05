var longstr = '<div class="hentry">     <a href="blog.html">       <img \
src="/resources/blog-big.gif" align="left" height="75" width="75" \
border="0"/>     </a>     <span class="entry-title">       <a \
href="blog.html" rel="bookmark">Every single piece of bike gear I buy \
ends up with a broken power button and it\'s getting old</a> \
</span>     <span class="updated">2013-12-19 11:02AM</span>     <div \
class="entry-summary">       <div \
xmlns="http://www.w3.org/1999/xhtml">Most of America has a bike.  And, \
expensive or cheap, it usually lives in the garage on rubber-coated \
hooks and gets pulled out on random sunny days and then forgotten \
about the rest of the time.  But then there\'s a small percentage of \
the population out there, which I\'m part of, that rides their bikes \
all the time, rain or shine, and gets real stuff done on their bikes, \
like commuting to work and buying groceries.  To do this safely \
requires a few pieces of electronic hardware.  Some people, like \
myself, ride a bit more than that.  And, at least for me, I\'ve found \
something really annoying in all of the biking gear I\'ve \
owned...</div>     </div>   </div> \
<div class="hentry">     <a \
href="/hacks/blog/littleche_monomaniacal/">       <img \
src="/resources/blog-big.gif" align="left" height="75" width="75" border="0"/> \
</a>     <span class="entry-title">       <a \
href="/hacks/blog/littleche_monomaniacal/" rel="bookmark">Monomaniacal \
littlechef: launching cloud servers, user cookbook, nagios cookbook, \
and DNS</a>     </span>     <span class="updated">2013-05-19 \
05:33PM</span>     <div class="entry-summary">       <div \
xmlns="http://www.w3.org/1999/xhtml">I\'m on a monomaniacal littlechef\
quest at home.  See, I burned a weekend helping a friend set up her \
chef and vagrant infrastructure some months ago.  And I wrote about \
it.  And I figured that it would eventually get back to it and re-do \
all of my servers.  Then I spent some time in sysadmin hell and ended \
up needing to re-construct my sites from the backups and realized that\
now was the time to fix this.       </div>     </div>   </div>'

exports = module.exports = function() {
	return function fetch_entity(req, res, next) {
		req.entity = {};
		_data = {};
		_data.posting = longstr;
		_data.meta = 
		{	eid: "123456", 
			created: "", 
			proto: "", 
			modified: "",
			revid: "12345",
			security: {
			    "navbar":false,
         		"searchable":true,
         		"findable":true,
         		"randomable":true,
         		"read":true,
         		"grants": {},
         		"flags": {}
         	}
		};
		_data.summary = 
		{"title": "blrg",
		 "abstract": "some text goes here"}
		req.entity.view = function () {
			return _data
		}
		next();
	};
};