var express = require('express');
var app = express();
var path_map = require('./middleware/path_map');
var fetch_entity = require('./middleware/fetch_entity')
var scheme_map = require('./middleware/scheme_map');
var page_map = require('./middleware/page_map')
var fetch_snippet = require('./middleware/fetch_snippet')
var path = require('path');
var query = require('./query')

app.use(express.logger(':remote-addr - - [:date] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms'));

app.use('/resources/',express.directory(path.join(__dirname, '../scheme/default/static')))
app.use('/resources/',express.static(path.join(__dirname, '../scheme/default/static')))

app.use(express.favicon())

app.use(path_map())
app.use(fetch_entity(query))
app.use(scheme_map())
app.use(page_map())
app.use(fetch_snippet())


app.use(function(req, res) {
	req.page.render(req,res)
});

app.listen(4000);
