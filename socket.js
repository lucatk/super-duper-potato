var app = null;
var database = null;
var logger = null;

var SocketIO = require('socket.io');
var passportIO = require("passport.socketio");
var io = null;

var offerSockets = {};

function Socket(mainApp) {
	app = mainApp;
	web = app.web();
	database = app.database();
	logger = app.logger();

	io = new SocketIO(web.server());
	io.use(passportIO.authorize({
		cookieParser: web.cookieParser(),
		key: 'connect.sid',
		secret: app.config().sessionSecret,
		store: web.sessionStore(),
		fail: function(data, message, error, accept) {
			if(error && message.valueOf() !== new String("Passport was not initialized").valueOf()) throw new Error(message);
			return accept();
		}
	}));
	io.on('connection', socketConnection);
}

function socketConnection(socket) {
	/* REGISTER EVENTS */
	var sendUpdate = function(data) {
		socket.emit('meta', {
			roundTime: app.config().roundTime,
			status: { //TODO
				steam: true,
				botsOnline: 10,
				botsTotal: 50
			}
		});
		database.getLatestGameRounds(3, function(rounds) {
			rounds.reverse().forEach(function(round) {
				if(typeof round === "undefined" || round === null) return;
				if(!round.finished) {
					round.percent = 0;
					round.salt = "";
				}
				socket.emit('round', round);
			});
		});
	};
	var loadSteamInventory = function(data) {
		if(!socket.request.user.logged_in)
			return;
		var user = socket.request.user;
		var r = {
			result: null,
			err: null
		};
		if(/^\d+$/.test(user._json.steamid)) {
			logger.info("Recieved request for #loadsteaminventory for SteamID " + user._json.steamid);
			var currentMs = getMilliseconds();
			app.bestBot().loadUserInventory(user._json.steamid, function(inv) {
				r.result = inv;
				socket.emit('steaminventory', r);
				var timeTaken = getMilliseconds() - currentMs;
				logger.info("Sent response for #loadsteaminventory for SteamID " + user._json.steamid + " - response time was " + timeTaken + "ms");
			});
		} else {
			logger.info("Recieved request for #loadsteaminventory, but SteamID not valid");
			r.err = "steamidinvalid";
			socket.emit('steaminventory', r);
		}
	};
	var loadUserInventory = function(data) {
		if(!socket.request.user.logged_in)
			return;
		var user = socket.request.user;
		var r = {
			result: null,
			err: null
		};

		if(/^\d+$/.test(user._json.steamid)) {
			logger.info("Recieved request for #loaduserinventory for SteamID " + user._json.steamid);
			var currentMs = getMilliseconds();
			database.getUser(user._json.steamid, function(dbUser) {
				var inv = {};
				for(botinv in dbUser.inventory) {
					inv[botinv] = dbUser.inventory[botinv];
				}
				r.result = inv;
				socket.emit('userinventory', r);
			});
		} else {
			logger.info("Recieved request for #loaduserinventory, but SteamID not valid");
			r.err = "steamidinvalid";
			socket.emit('userinventory', r);
		}
	};
	var sendDepositOffer = function(data) {
		if(!socket.request.user.logged_in)
			return;

		//logger.debug(JSON.stringify(data));

		var user = socket.request.user;
		var r = {
			result: null,
			err: null
		};
		var steam = app.bestBot();

		var steamid = user._json.steamid;
		database.getUser(steamid, function(dbUser) {
			var token = dbUser.tradeurl.token;

			var wantedItems = data.items;
			if(steamid.length > 0 && (/^\d+$/.test(steamid))) {
				if(wantedItems.length > 0) {
					steam.checkEscrow(steamid, token, function(hasEscrow) {
						if(hasEscrow) {
							logger.info("Recieved post request for /sendoffer/, but partner has escrow or escrow could not be determined");
							r.err = "escrow";
							//res.send(JSON.stringify(r));
							socket.emit('offersent', r);
						} else {
							steam.sendDepositOffer(steamid, token, wantedItems, "", function(err, result) {
								if(result == null) {
									r.err = "offerfailed";
									socket.emit('offersent', r);
								} else {
									r.result = result;
									socket.emit('offersent', r);
									if((!err || !err.eresult) && result !== null && result !== 'pending') {
										offerSockets[result] = socket;
									}
								}
							});
						}
					});
				} else {
					logger.info("Recieved post request for /sendoffer/, but no items specified");
					r.err = "noitems";
					//res.send(JSON.stringify(r));
					logger.debug(JSON.stringify(r));
				}
			} else {
				logger.info("Recieved post request for /sendoffer/, but SteamID not valid");
				r.err = "steamidinvalid";
				//res.send(JSON.stringify(r));
				logger.debug(JSON.stringify(r));
			}
		});
	};

	socket.on('loadsteaminventory', loadSteamInventory);
	socket.on('loaduserinventory', loadUserInventory);
	socket.on('senddepositoffer', sendDepositOffer);
	socket.on('update', sendUpdate);
}

function getMilliseconds() {
    var hrtime = process.hrtime();
    return ( hrtime[0] * 1000000 + hrtime[1] / 1000 ) / 1000;
}

Socket.prototype.sendOfferStatus = function(status, offerid) {
	var socket = offerSockets[offerid];
	if(typeof socket !== 'undefined' && socket !== null) {
		socket.emit('offerstatus', { 'id': offerid, 'status': status });
		delete offerSockets[offerid];
	}
}

Socket.prototype.updateMeta = function(meta) {
	io.emit('meta', {
		roundTime: app.config().roundTime,
		status: { //TODO
			steam: true,
			botsOnline: 10,
			botsTotal: 50
		}
	});
}

Socket.prototype.sendRoundUpdate = function(round) {
	if(!round.finished) {
		round.percent = -1;
		round.salt = "";
	}
	io.emit('round', round);
}

module.exports = Socket;