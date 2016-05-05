var SteamUser = require('steam-user');
var SteamCommunity = require('steamcommunity');
var SteamTOTP = require('steam-totp');
var TradeOfferManager = require('steam-tradeoffer-manager');
var request = require('request');
var pricing = require('steam-market-pricing');
var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');

var app = null;
var config = null;
var logger = null;
var client = null;
var manager = null;
var community = null;

var id = null;
var priceDB = '';

function Steam(mainApp, botCfg) {
	app = mainApp;
	config = app.config();
	logger = app.logger();
	database = app.database();
	botConfig = botCfg;

	client = new SteamUser();
	manager = new TradeOfferManager({
		"steam": client,
		"domain": config.domain,
		"language": config.language,
		"cancelTime": config.cancelTime
	});
	community = new SteamCommunity();
	this.registerEvents(client, manager);

	// Steam logon options
	var logOnOptions = {
		"accountName": botConfig.username,
		"password": botConfig.password,
		"twoFactorCode": SteamTOTP.getAuthCode(botConfig.sharedSecret)
	};

	if(fs.existsSync(botConfig.polldataFile)) {
		manager.pollData = JSON.parse(fs.readFileSync(botConfig.polldataFile));
	}

	client.logOn(logOnOptions);

	this.loadPriceDatabase();
}

Steam.prototype.loadPriceDatabase = function() {
	request('https://api.csgofast.com/price/all', function(error, response, body) {
		if(!error && response.statusCode == 200) {
			priceDB = JSON.parse(body);
			logger.debug("[" + (id || 0) + "] Got price database. Loaded " + Object.keys(priceDB).length + " prices.");
		} else {
			logger.debug("[" + (id || 0) + "] Loading price database failed. Prices not available.");
		}
	});
};

Steam.prototype.checkEscrow = function(steamid, token, callback) {
	manager.getEscrowDuration(steamid, token, function(err, daysTheirEscrow, daysYourEscrow) {
		callback((typeof err !== 'undefined' && err !== null && err.length > 0) || (typeof daysTheirEscrow !== 'undefined' && daysTheirEscrow > 0));
	});
};

Steam.prototype.sendDepositOffer = function(steamid, token, items, message, callback) {
	var offer = manager.createOffer(steamid);
	offer.loadPartnerInventory(730, 2, function(err, inventory, currencies) {
		var pitems = inventory.filter(function(item) {
			var match = false;
			items.forEach(function(i) {
				if(item.id === i.id && item.classid === i.classid) {
					match = true;
				}
			});
			return match;
			/*return item.tags.some(function(element, index, array) {
				return items.indexOf(element.id) > -1;
			});*/
		});
		//logger.debug(JSON.stringify(pitems));
		offer.addTheirItems(pitems);
		offer.send(message, token, function(err, status) {
			//logger.debug(JSON.stringify(err));
			if(err && (!err.eresult || err.eresult !== 16)) {
				callback(err, null);
			} else {
				//logger.debug(JSON.stringify(status));
				if(status == 'pending') {
					callback(err, 'pending');
				} else {
					callback(err, offer.id);
				}
			}
		});
	});
};

Steam.prototype.getItemPrices = function(names, callback) {
	pricing.getItemsPrice(730, names, function(err, data) {
		if(err || !data || data == null) {
			logger.info('[' + (id || 0) + '] Error getting item prices: ' + err);
			callback('');
		} else {
			logger.debug(data);
			//if(parseInt(data.volume) < 10) {
			//	callback('');
			//} else {
			callback(data);
			//}
		}
	}, 1);
}

Steam.prototype.loadUserInventory = function(steamid, callback) {
	var items = "";
	var itemPrices = this.getItemPrices;
	manager.loadUserInventory(steamid, 730, 2, true, function(err, inventory, currencies) {
		var itemsWithPrice = [];
		inventory.forEach(function(value) {
			delete value['fraudwarnings'];
			delete value['descriptions'];
			delete value['owner_descriptions'];
			delete value['actions'];
			delete value['market_actions'];
			delete value['owner_actions'];
			value.price = priceDB[value.market_hash_name];
			itemsWithPrice.push(value);
		});

		var eligibleItems = itemsWithPrice.filter(function(item) {
			return item.tags.some(function(element, index, array) {
				return element.category == "Weapon" || element.name == "Key" || element.name == "Case";
			});
		});
		eligibleItems.sort(function(a, b) {
			return b.price - a.price;
		});

		callback(JSON.stringify(eligibleItems));
		/*var itemNames = [];
		inventory.forEach(function(value) {
			itemNames.push(value.market_hash_name);
		});
		logger.debug("H8");
		itemPrices(itemNames, function(prices) {
			var itemsWithPrice = [];
			inventory.forEach(function(value) {
				value.price = prices[value.market_hash_name];
				itemsWithPrice.push(value);
			});

			logger.debug("H9");

			var eligibleItems = itemsWithPrice.filter(function(item) {
				return item.tags.some(function(element, index, array) {
					return element.category == "Weapon" || element.name == "Key" || element.name == "Case";
				});
			});
			eligibleItems.sort(function(a, b) {
				if(a.price == '' && b.price == '') {
					return 0;
				} else if(a.price == '') {
					return -1;
				} else if(b.price == '') {
					return 1;
				} else {
					return parseFloat(a.price.substring(1)) - parseFloat(b.price.substring(1));
				}
			});
			callback(JSON.stringify(eligibleItems));
		});*/
	});
};

Steam.prototype.getTOManager = function() {
	return manager;
};

Steam.prototype.registerEvents = function(client, manager) {
	client.on('loggedOn', this.onLogon);
	client.on('webSession', this.onWebLogon);
	manager.on('pollData', this.onPoll);
	manager.on('sentOfferChanged', this.onOfferChanged);
};

Steam.prototype.onLogon = function() {
	id = client.steamID.getSteamID64();
	logger.info("[" + (id || 0) + "] Logged into Steam");
};

Steam.prototype.onWebLogon = function(sessionID, cookies) {
	manager.setCookies(cookies, function(err) {
		if(err) {
			//console.log(err);
			logger.error(err);
			process.exit(1); // Fatal error since we couldn't get our API key
			return;
		}

		//console.log("Got API key: " + manager.apiKey);
		logger.debug("[" + (id || 0) + "] Got API key: " + manager.apiKey);
	});
	
	community.setCookies(cookies);
	//community.startConfirmationChecker(30000, botConfig.identitySecret); // Checks and accepts confirmations every 30 seconds
};

Steam.prototype.onPoll = function(pollData) {
	mkdirp(path.dirname(botConfig.polldataFile), function(err) {
		if(err) {
			logger.error('[' + (id || 0) + '] An error occured while writing a polldata file: ' + err);
		}
		fs.writeFile(botConfig.polldataFile, JSON.stringify(pollData));
	})
};

Steam.prototype.onOfferChanged = function(offer, oldState) {
	logger.info("[" + (id || 0) + "] Offer #" + offer.id + " changed: " + TradeOfferManager.getStateName(oldState) + " -> " + TradeOfferManager.getStateName(offer.state));
	if(offer.isOurOffer && oldState === 2 && offer.state === 3) {
		if(offer.itemsToReceive.length > 0) {
			var items = [];
			offer.itemsToReceive.forEach(function(value) {
				delete value['fraudwarnings'];
				delete value['descriptions'];
				delete value['owner_descriptions'];
				delete value['actions'];
				delete value['market_actions'];
				delete value['owner_actions'];
				items.push(value);
			});
			database.addToInventory(offer.partner.getSteamID64(), id, items, function(results) {});
		} else if(offer.itemsToGive.length > 0) {
			var items = [];
			offer.itemsToGive.forEach(function(value) {
				delete value['fraudwarnings'];
				delete value['descriptions'];
				delete value['owner_descriptions'];
				delete value['actions'];
				delete value['market_actions'];
				delete value['owner_actions'];
				items.push(value);
			});
			database.removeFromInventory(offer.partner.getSteamID64(), id, items);
		}
		app.socket().sendOfferStatus('accepted', offer.id);
	} else if(offer.isOurOffer && oldState === 2 && offer.state >= 4) {
		app.socket().sendOfferStatus('canceled', offer.id);
	}
};

Steam.prototype.getPriceDB = function() {
	return priceDB;
}

module.exports = Steam;