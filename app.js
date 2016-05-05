// **************** //
//   DECLARATIONS   //
var config = require('./config.js');
var Winston = require('winston');
var logger = new (Winston.Logger)({
		transports: [
			new (Winston.transports.Console)({
				colorize: true, 
				timestamp: true,
				level: 'debug'
			}),
			new (require('winston-daily-rotate-file'))({
				level: 'info', 
				timestamp: true,
				datePattern: '.yyyyMMdd',
				filename: 'logs/' + config.logFile,
				json: false
			})
		]
});
var readline = require('readline');
var fs = require('fs');
var rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});
rl.resume();
var microtime = require('microtime');
var crypto = require('crypto');


// *********** //
//   EXPORTS   //
var exports = module.exports = {};

exports.bot = function(id) {
	return bots[id];
}
var nextBot = 0;
exports.bestBot = function() {
	var bot = bots[nextBot];
	nextBot = nextBot + 1;
	if(nextBot >= bots.length) nextBot = 0;
	return bot;
}
exports.database = function() {
	return database;
}
exports.web = function() {
	return web;
}
exports.socket = function() {
	return socket;
}
exports.config = function() {
	return config;
}
exports.logger = function() {
	return logger;
}
exports.game = function() {
	return game;
}
exports.microtime = function() {
	return microtime;
}
exports.crypto = function() {
	return crypto;
}

// *************** //
//   APP MODULES   //

/*var SteamModule = require('./steam.js');
var DatabaseModule = require('./database.js');
var WebModule = require('./web.js');
var SocketModule = require('./socket.js');
var GameModule = require('./game.js');

var database = new DatabaseModule(exports, function(db) {});
var web = new WebModule(exports);
var socket = new SocketModule(exports);

var bots = [];
config.bots.forEach(function(bot) {
	bots.push(new SteamModule(exports, bot));
});*/

var SteamModule = require('./steam.js');
var DatabaseModule = require('./database.js');
var WebModule = require('./web.js');
var SocketModule = require('./socket.js');
var GameModule = require('./game.js');

var web = null;
var socket = null;
var game = null;
var bots = [];
var database = new DatabaseModule(exports, function(db) {
	web = new WebModule(exports);
	socket = new SocketModule(exports);
	game = new GameModule(exports);

	config.bots.forEach(function(bot) {
		bots.push(new SteamModule(exports, bot));
	});
});