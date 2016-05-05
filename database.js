var MariaClient = require('mariasql');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

var app = null;
var config = null;
var logger = null;
var db = null;

var statements = new Array();

function Database(mainApp, connectCallback) {
	app = mainApp;
	config = app.config();
	logger = app.logger();

	this.connect(connectCallback);
}

Database.prototype.connect = function(callback) {
	MongoClient.connect("mongodb://" + config.dbHost + ":" + config.dbPort + "/" + config.dbName, function(err, database) {
		assert.equal(null, err);
		logger.info("Connected to MongoDB at " + config.dbHost + ":" + config.dbPort + ".");
		db = database;
		callback(db);
	});

	/*sql = new MariaClient();

	var prepareStatements = this.prepareStatements;
	sql.on('ready', function() {
		logger.info('Connected to MySQL server at ' + config.mysqlHost);
		isConnected = true;
		prepareStatements();
	});
	sql.on('error', function(err) {
		logger.error('A MySQL error occured: ' + err);
		isConnected = false;
	});

	sql.connect({
		user: config.mysqlUser,
		password: config.mysqlPassword,
		host: config.mysqlHost,
		db: config.mysqlDatabase,
	});*/
};

/*Database.prototype.prepareStatements = function() {
	// GET
	statements['get_user'] = sql.prepare('SELECT * FROM `users` WHERE steamid=:steamid');

	// CREATE
	statements['create_user'] = sql.prepare('INSERT INTO `users`(`steamid`) VALUES(`:steamid`)');
	statements['insert_userinfo'] = sql.prepare('INSERT INTO `users` (steamid, lastKnownName, avatar, avatarLarge) VALUES (:steamid, :name, :avatar, :avatarLarge) ON DUPLICATE KEY UPDATE `lastKnownName`=VALUES(lastKnownName), `avatar`=VALUES(avatar), `avatarLarge`=VALUES(avatarLarge)');

	// UPDATE
	statements['update_user_tradeURL'] = sql.prepare('UPDATE `users` SET `tradePartnerId`=:partnerId, `tradeToken`=:token WHERE `steamid`=:steamid');
	statements['update_user_autoSendWinnings'] = sql.prepare('UPDATE `users` SET `autoSendWinnings`=:autoSendWinnings WHERE `steamid`=:steamid');
	statements['update_user_privacy'] = sql.prepare('UPDATE `users` SET `profilePrivacy`=:privacy WHERE `steamid`=:steamid');
	statements['update_user_name'] = sql.prepare('UPDATE `users` SET `lastKnownName`=:name WHERE `steamid`=:steamid');
	statements['update_user_earnings'] = sql.prepare('UPDATE `users` SET `earnings`=:earnings WHERE `steamid`=:steamid');
};*/

Database.prototype.getUser = function(steamid, callback) {
    var cursor = db.collection('users').find({ "_id": steamid });
    cursor.limit(1).each(function(err, doc) {
		assert.equal(err, null);
		if(doc !== null) {
			callback(doc);
		}
    });

    /*sql.query(statements.get_user({ steamid: steamid }), { useArray: true }, function(err, rows) {
    	if(err)

    		logger.error('A MySQL error occured: ' + err);callback(rows);
    });*/
};

Database.prototype.createUser = function(steamid, username, avatar, avatarLarge, callback) {
	db.collection('users').updateOne({ "_id": steamid }, {
		$set: {
			"_id": steamid,
			"lastKnownName": username,
			"avatars": {
				"normal": avatar,
				"large": avatarLarge
			}
		},
		$setOnInsert: {
			"earnings": 0.00,
			"tradeurl": {
				"id": "",
				"token": ""
			},
			"settings": {
				"autoSendWinnings": 0,
				"profilePrivacy": 0
			},
			"inventory": {}
		}
	}, { upsert: true }, function(err, result) {
		assert.equal(null, err);
		callback(result);
	});
}

Database.prototype.updateSettings = function(steamid, tradePartnerId, tradeToken, autoSendWinnings, profilePrivacy, callback) {
	db.collection('users').updateOne({ "_id": steamid }, {
		$set: {
			"tradeurl": {
				"id": tradePartnerId,
				"token": tradeToken
			},
			"settings": {
				"autoSendWinnings": autoSendWinnings,
				"profilePrivacy": profilePrivacy
			}
		}
	}, function(err, results) {
		callback(results);
	});
}

Database.prototype.addToInventory = function(steamid, botid, items, callback) {
	var priceDB = app.bestBot().getPriceDB();
	var withPrices = [];
	items.forEach(function(i) {
		i.price = priceDB[i.market_hash_name];
		withPrices.push(i);
	});
	db.collection('users').update({ "_id": steamid }, {
		$addToSet: {
			[`inventory.${botid}`]: {
				$each: withPrices
			}
		}
	}, function(err, results) {
		callback(results);
	});
}

Database.prototype.removeInventoryItem = function(steamid, botid, item) {
	db.collection('users').update({ "_id": steamid }, {
		$pull: {
			[`inventory.${botid}`]: {
				assetid: item.assetid,
				classid: item.classid
			}
		}
	});
}

Database.prototype.removeFromInventory = function(steamid, botid, items) {
	var rmv = this.removeInventoryItem;
	items.forEach(function(item) {
		rmv(steamid, botid, item);
	});
}

Database.prototype.createGameRound = function(salt, percent, hash, callback) {
	this.getNextSequence("roundid", function(seq) {
		var date = new Date();
		db.collection('rounds').insertOne({
			"_id": seq,
			"creation": date,
			"lastUpdate": date,
			"timer": -1,
			"salt": salt,
			"percent": percent,
			"hash": hash,
			"players": {},
			"deposits": [],
			"ticketAmount": 0,
			"winner": null,
			"finished": false
		}, function(err, result) {
			assert.equal(null, err);
			callback(result);
		});
	});
}

Database.prototype.getGameRound = function(id, callback) {
	var cursor = db.collection('rounds').find({ "_id": id }).limit(1);
    var ex = false;
	cursor.each(function(err, doc) {
		if(ex) return;
		assert.equal(err, null);
		callback(doc);
		ex = true;
    });
}

Database.prototype.getLatestGameRounds = function(amount, callback) {
	var cursor = db.collection('rounds').find().sort({ "_id": -1 }).limit(amount);
	cursor.toArray(function(err, items) {
		assert.equal(err, null);
		callback(items)
    });
}

Database.prototype.getLatestGameRound = function(callback) {
	var cursor = db.collection('rounds').find().sort({ "_id": -1 });
    var ex = false;
    cursor.limit(1).each(function(err, doc) {
		if(ex) return;
		assert.equal(err, null);
		callback(doc);
		ex = true;
    });
}

Database.prototype.addDeposit = function(id, deposit, callback) {
	var get_user = this.getUser;
	db.collection('rounds').update({ "_id": id }, {
		$addToSet: {
			"deposits": {
				"time": app.microtime().now(),
				"user": deposit.steamid,
				"items": deposit.items,
				"tickets": deposit.tickets
			}
		},
		$currentDate: {
			"lastUpdate": { $type: "timestamp" }
		}
	}, function(err, results) {
		var player = deposit.user;
		var randomColor = "#000000".replace(/0/g,function(){return (~~(Math.random()*16)).toString(16);});
		get_user(player, function(user) {
			db.collection('rounds').update({ $and: [{ "_id": id },  { [`players.${player}`]: { $exists: false } }] }, {
				[`players.${player}`]: {
					"color": randomColor,
					"displayName": user.lastKnownName,
					"avatar": user.avatars.normal
				}
			}, function(err, results) {
				callback(results);
			});
		});
	});
}

Database.prototype.updateWinner = function(id, winner, callback) {
	db.collection('rounds').update({ "_id": id }, {
		$set: {
			"winner": winner,
			"finished": true
		},
		$currentDate: {
			"lastUpdate": { $type: "timestamp" }
		}
	}, function(err, results) {
		callback(results);
	});
}

Database.prototype.getNextSequence = function(name, callback) {
	db.collection('counters').findAndModify({ "_id": name }, [], {
		$inc: { seq: 1 }
	}, function(err, results) {
		assert.equal(null, err);
		callback(results.value.seq);
	});
}

Database.prototype.getCurrentSequence = function(name, callback) {
	var cursor = db.collection('counters').find({ "_id": name });
	var ex = false;
	cursor.limit(1).each(function(err, doc) {
		if(ex) return;
		assert.equal(err, null);
		callback(doc.seq);
		ex = true;
    });
}

Database.prototype.updateRoundCountdown = function(id, countdown, callback) {
	db.collection('rounds').update({ "_id": id }, {
		$set: {
			"timer": countdown
		},
		$currentDate: {
			"lastUpdate": { $type: "timestamp" }
		}
	}, function(err, results) {
		callback(results);
	});
}

module.exports = Database;