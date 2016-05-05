var debug = require('debug')('luuc-jackpot:server');
var http = require('http');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var FileStreamRotator = require('file-stream-rotator')
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var session = require('express-session');
var MemoryStore = session.MemoryStore;
var SteamStrategy = require('passport-steam').Strategy;
var web = express();
var fs = require('fs');

var app = null;
var logger = null;
var config = null;
var database = null;

var logDirectory = __dirname + '/logs';
var port = normalizePort(process.env.PORT || '3030');
var server = null;
var sessionStore = null;

function Web(mainApp) {
	app = mainApp;
	logger = app.logger();
	config = app.config();
	database = app.database();

	sessionStore = new MemoryStore();

	web.set('port', port);
	server = http.createServer(web);
	server.listen(port);
	server.on('error', onError);
	server.on('listening', onListening);

	// ensure log directory exists
	fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);
	var accessLogStream = FileStreamRotator.getStream({
		date_format: 'YYYYMMDD',
		filename: logDirectory + '/access-%DATE%.log',
		frequency: 'daily',
		verbose: false
	});
	web.use(morgan('combined', {stream: accessLogStream}));

	// *************** //
	//   VIEW ENGINE   //
	web.set('views', path.join(__dirname, 'views'));
	web.set('view engine', 'ejs');


	// ************ //
	//   PASSPORT   //
	passport.serializeUser(function(user, done) {
		done(null, user);
	});

	passport.deserializeUser(function(obj, done) {
		done(null, obj);
	});

	passport.use(new SteamStrategy({
			returnURL: 'http://localhost:3030/auth/steam/return',
			realm: 'http://localhost:3030/',
			apiKey: config.bots[0].apiKey
		},
		function(identifier, profile, done) {
			process.nextTick(function () {
				profile.identifier = identifier;
				return done(null, profile);
			});
		}
	));


	// ******************** //
	//   EXPRESS SETTINGS   //
	web.use(session({
		store: sessionStore,
		secret: config.sessionSecret,
		resave: true,
		saveUninitialized: true,
	}));
	web.use(passport.initialize());
	web.use(passport.session());
	web.use(bodyParser.json());
	web.use(bodyParser.urlencoded({ extended: false }));
	web.use(cookieParser());
	web.use(express.static(path.join(__dirname, 'public')));
	//web.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));


	// ********** //
	//   ROUTES   //
	web.get('/', function(req, res, next) {
		var view = 'index';

		if(req.user !== null && typeof req.user !== 'undefined') {
			database.getUser(req.user._json.steamid, function(user) {
				res.render(view, { user: user });
			});
		} else {
			res.render(view);
		}
	});

	web.get('/:viewname', function(req, res, next) {
		var view = req.params.viewname;
		if(view === 'favicon.ico') return;

		fs.exists(path.join(path.join(__dirname, 'views'), view) + '.ejs', function(exists) {
			if(exists) {
				var userData = null;
				if(req.user !== null && typeof req.user !== 'undefined') {
					database.getUser(req.user._json.steamid, function(user) {
						res.render(view, { user: user, context: req.query.c });
					});
				} else {
					res.render(view);
				}
			} else {
				fs.exists(path.join(path.join(__dirname, 'views/auth'), view) + '.ejs', function(exists) {
					if(exists) {
						var userData = null;
						if(req.user !== null && typeof req.user !== 'undefined') {
							database.getUser(req.user._json.steamid, function(user) {
								res.render('auth/' + view, { user: user, context: req.query.c });
							});
						} else {
							res.redirect('/');
						}
					}
				});
			}
		});
	});

	web.post('/account', ensureAuthenticated, function(req, res, next) {
		if(req.body.tradeurl !== null && req.body.tradeurl.length > 0 && req.body.autoreturn !== null && req.body.autoreturn.length > 0 && req.body.privacy !== null && req.body.privacy.length > 0) {
			var turlSplit = req.body.tradeurl.split('&token=');
			var tradeToken = turlSplit[1];
			var tradePartnerId = turlSplit[0].split('?partner=')[1];

			if(tradePartnerId !== null && (tradePartnerId.length == 8 || tradePartnerId.length == 9) && tradeToken !== null && tradeToken.length == 8) {
				/*database.updateTradeUrl(req.user._json.steamid, tradePartnerId, tradeToken, function() {
					database.updateAutoSendWinnings(req.user._json.steamid, req.body.autoreturn == 1 ? 1 : 0, function() {
						database.updateProfilePrivacy(req.user._json.steamid, req.body.privacy == 1 ? 1 : 0, function() {
							database.getUser(req.user._json.steamid, function(user) {
								res.render('auth/account', { title: "My Account", current: "myaccount", user: user[0], alert: 'settings_success' });
							});
						});
					});
				});*/
				database.updateSettings(req.user._json.steamid, tradePartnerId, tradeToken, req.body.autoreturn == 1 ? 1 : 0, req.body.privacy == 1 ? 1 : 0, function(user) {
					database.getUser(req.user._json.steamid, function(user) {
						res.render('auth/account', { title: "My Account", current: "myaccount", user: user, alert: 'settings_success' });
					});
				});
			} else {
				database.getUser(req.user._json.steamid, function(user) {
					res.render('auth/account', { title: "My Account", current: "myaccount", user: user, alert: 'settings_error_tradeurl' });
				});
			}
		} else {
			database.getUser(req.user._json.steamid, function(user) {
				res.render('auth/account', { title: "My Account", current: "myaccount", user: user, alert: 'settings_error' });
			});
		}
	});

	web.get('/auth/steam', passport.authenticate('steam', { failureRedirect: '/' }), function(req, res) {});
	web.get('/auth/steam/return', passport.authenticate('steam', { failureRedirect: '/' }), function(req, res) {
		if(req.user !== null && typeof req.user !== 'undefined') {
			database.createUser(req.user._json.steamid, req.user._json.personaname, req.user._json.avatar, req.user._json.avatarfull, function(usr) {
				res.redirect('/');
			});
		} else {
			res.redirect('/');
		}
	});

	web.get('/auth/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});
}

Web.prototype.server = function() {
	return server;
};

Web.prototype.sessionStore = function() {
	return sessionStore;
}

Web.prototype.cookieParser = function() {
	return cookieParser;
}

function normalizePort(val) {
	var port = parseInt(val, 10);

	if (isNaN(port)) {
		// named pipe
		return val;
	}

	if (port >= 0) {
		// port number
		return port;
	}

	return false;
}

function onError(error) {
	if (error.syscall !== 'listen') {
		throw error;
	}

	var bind = typeof port === 'string'
		? 'Pipe ' + port
		: 'Port ' + port;

	// handle specific listen errors with friendly messages
	switch (error.code) {
		case 'EACCES':
			console.error(bind + ' requires elevated privileges');
			process.exit(1);
			break;
		case 'EADDRINUSE':
			console.error(bind + ' is already in use');
			process.exit(1);
			break;
		default:
			throw error;
	}
}

function onListening() {
	var addr = server.address();
	var bind = typeof addr === 'string'
		? 'pipe ' + addr
		: 'port ' + addr.port;
	debug('Listening on ' + bind);
}

function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) { return next(); }
	res.redirect('/');
}

module.exports = Web;

// development error handler
// will print stacktrace
/*if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
	  message: err.message,
	  error: err
	});
  });
}*/

// production error handler
// no stacktraces leaked to user
/*app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		title: 'Error',
		message: err.message,
		error: {},
	});
});*/