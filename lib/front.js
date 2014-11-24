var express = require('express');
var flash = require('connect-flash');
var app = express();
var path_map = require('./middleware/path_map');
var fetch_entity = require('./middleware/fetch_entity');
var scheme_map = require('./middleware/scheme_map');
var page_map = require('./middleware/page_map');
var fetch_snippet = require('./middleware/site_map');
var error_handle = require('./middleware/error_handle');
var path = require('path');
var query = require('./query');
var Scheme = require('./scheme');
var entity = require('./entity');
var db = require('./db');
var bodyParser = require('body-parser');
var local_auth = require('./middleware/local_auth');

app.use(express.cookieParser());
app.use(express.methodOverride());
app.use(express.session({ secret: 'keyboard cat' }));
app.use(flash());

local_auth.passport(app);

app.use(express.logger(':remote-addr - - [:date] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms'));

app.use('/resources/',express.directory(path.join(__dirname, '../scheme/default/static')));
app.use('/resources/',express.static(path.join(__dirname, '../scheme/default/static')));
app.use('/resources/jquery',express.static(path.join(__dirname, '../bower_components/jquery')));
app.use('/resources/jquery-dropdown',express.static(path.join(__dirname, '../bower_components/jquery-dropdown')));

app.use(express.favicon());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(scheme_map(Scheme, db, query));

local_auth.passport_paths(app);

app.use(path_map());
app.use(fetch_entity(db, query, entity.Entity));
app.use(page_map());
app.use(fetch_snippet());

app.use(function(req, res, next) {
	req.page.render(db, req, res, next);
});

app.use(error_handle());

app.listen(4000);
