var express = require('express');
var app = express();
var pathMap = require('./middleware/path_map');
var fetchEntity = require('./middleware/fetch_entity');
var schemeMap = require('./middleware/scheme_map');
var pageMap = require('./middleware/page_map');
var siteMap = require('./middleware/site_map');
var errorHandle = require('./middleware/error_handle');
var contextCreate = require('./middleware/context_create');
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
var winston = require('winston'),
    expressWinston = require('express-winston');
var expstate = require('express-state');

expstate.extend(app);

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {colorize: true});

app.use(expressWinston.logger({
  winstonInstance: winston,
  meta: true, // optional: control whether you want to log the meta data about the request (default to true)
  msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
  expressFormat: false,
  colorStatus: false,
}));

localAuth.passportConnect(db, query, entity.Entity, new SitePath(['wh', 'users']));

app.use(cookieParser());
app.use(methodOverride());
app.use(session({secret: 'keyboard cat', resave: false, saveUninitialized: true}));
app.use(flash());

app.use('/resources/', serveIndex(path.join(__dirname, '../scheme/default/static')));
app.use('/resources/', serveStatic(path.join(__dirname, '../scheme/default/static')));
app.use('/resources/jquery', serveStatic(path.join(__dirname, '../bower_components/jquery')));
app.use('/resources/jquery-dropdown', serveStatic(path.join(__dirname, '../bower_components/jquery-dropdown')));
app.use(favicon('./scheme/default/static/favicon.ico'));

localAuth.passport(app);
app.use(contextCreate());

app.use(bodyParser.urlencoded({extended: true}));

app.use(schemeMap(Scheme, db, query));
app.use(siteMap());

localAuth.passportPaths(app);

app.use(pathMap());
app.use(fetchEntity(db, query, entity.Entity));
app.use(pageMap());

app.use(function(req, res, next) {
  req.db = db;
  req.page.render(req, res, next);
});

app.use(expressWinston.errorLogger({
  winstonInstance: winston
}));

app.use(errorHandle());

app.listen(4000);
