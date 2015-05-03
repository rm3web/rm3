var express = require('express');
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
var serveIndex = require('serve-index'),
    serveStatic = require('serve-static'),
    favicon = require('serve-favicon'),
    flash = require('connect-flash'),
    cookieParser = require('cookie-parser'),
    methodOverride = require('method-override'),
    session = require('express-session'),
    morgan = require('morgan');
var local_auth = require('./middleware/local_auth');
var SitePath = require('./sitepath');


local_auth.passport_connect(db, query, entity.Entity, new SitePath(['wh', 'users']));

app.use(cookieParser());
app.use(methodOverride());
app.use(session({ secret: 'keyboard cat' }));
app.use(flash());

local_auth.passport(app);

app.use(morgan(':remote-addr - - [:date] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms'));

app.use('/resources/',serveIndex(path.join(__dirname, '../scheme/default/static')));
app.use('/resources/',serveStatic(path.join(__dirname, '../scheme/default/static')));
app.use('/resources/jquery',serveStatic(path.join(__dirname, '../bower_components/jquery')));
app.use('/resources/jquery-dropdown',serveStatic(path.join(__dirname, '../bower_components/jquery-dropdown')));

app.use(favicon('./scheme/default/static/favicon.ico'));
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
