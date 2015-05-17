var express = require('express');
var app = express();
var pathMap = require('./middleware/path_map');
var fetchEntity = require('./middleware/fetch_entity');
var schemeMap = require('./middleware/scheme_map');
var pageMap = require('./middleware/page_map');
var siteMap = require('./middleware/site_map');
var errorHandle = require('./middleware/error_handle');
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
var localAuth = require('./middleware/local_auth');
var SitePath = require('./sitepath');


localAuth.passportConnect(db, query, entity.Entity, new SitePath(['wh', 'users']));

app.use(cookieParser());
app.use(methodOverride());
app.use(session({ secret: 'keyboard cat' }));
app.use(flash());

localAuth.passport(app);

app.use(morgan(':remote-addr - - [:date] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms'));

app.use('/resources/',serveIndex(path.join(__dirname, '../scheme/default/static')));
app.use('/resources/',serveStatic(path.join(__dirname, '../scheme/default/static')));
app.use('/resources/jquery',serveStatic(path.join(__dirname, '../bower_components/jquery')));
app.use('/resources/jquery-dropdown',serveStatic(path.join(__dirname, '../bower_components/jquery-dropdown')));

app.use(favicon('./scheme/default/static/favicon.ico'));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(schemeMap(Scheme, db, query));

localAuth.passportPaths(app);

app.use(pathMap());
app.use(fetchEntity(db, query, entity.Entity));
app.use(pageMap());
app.use(siteMap());

app.use(function(req, res, next) {
  req.db = db;
  req.page.render(req, res, next);
});

app.use(errorHandle());

app.listen(4000);
