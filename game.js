var app = null;
var socket = null;
var database = null;
var logger = null;
var config = null;
var crypto = null;

var timerHandle = -1;
var countdown = -1;

function addDeposit(deposit, callback) {
	database.getLatestGameRound(function(round) {
		if(typeof round !== 'undefined' && round !== null) {
			if(!round.finished) {
				var itemCount = 0;
				for(var deposit in round.deposits) {
					itemCount += deposit.items.length;
				}
				if(itemCount >= 50) {
					logger.error(""); //TODO
				} else {
					database.addDeposit(round._id, deposit, function(results) {
						database.getLatestGameRound(function(r) {
							if(r.deposits.length > 0 && r.players.length > 1) {
								if((itemCount + deposit.items.length) >= 50) {
									drawCurrentRound();
								} else {
									if(timerHandle == -1) {
										logger.info("Started round timer for round " + round._id + " with " + config.roundTime + " seconds.");
										timerHandle = setInterval(drawCurrentRound, config.roundTime * 1000);
									}
								}
							}
						});
					});
				}
			}
		}
		logger.info(""); //TODO
	});
}

function Game(mainApp) {
	app = mainApp;
	socket = app.socket();
	database = app.database();
	logger = app.logger();
	config = app.config();
	crypto = app.crypto();

	countdown = config.roundTime;

	updateCurrentRound();
}

function createRound() {
	var salt = crypto.randomBytes(8).readUIntLE(0, 8).toString(16);
	var percent = crypto.randomBytes(4).readUIntLE(0, 4) / 0xFFFFFFFF;
	var hash = crypto.createHash('md5').update(salt + percent).digest('hex');
	database.createGameRound(salt, percent, hash, function(result) {
		updateCurrentRound();
	});
}

function updateCurrentRound() {
	database.getLatestGameRound(function(round) {
		if(typeof round !== "undefined" && round !== null && !round.finished) {
			logger.info("Loaded round " + round._id + " with " + round.deposits.length + " deposits from " + round.players.length + " players. Last update was" + round.lastUpdate + ".");
			if(round.deposits.length > 0 && round.players.length > 1) {
				if(round.timer != -1 && round.timer > 0) {
					countdown = round.timer-1;
				} else {
					countdown = config.roundTime;
				}
				logger.info("Started round timer for round " + round._id + " with " + countdown + " seconds.");
				timerHandle = setInterval(roundCountdown, 1000, round._id);
			}
			socket.sendRoundUpdate(round);
			//TODO
		} else {
			createRound();
		}
	});
}

function roundCountdown(id) {
	if(countdown == -1) return;
	database.updateRoundCountdown(id, countdown);
	if(countdown < 1) {
		drawCurrentRound();
	} else {
		countdown--;
	}
}

function drawCurrentRound() {
	if(timerHandle !== -1) {
		clearInterval(timerHandle);
		timerHandle = -1;
		countdown = -1;
	}
	database.getLatestGameRound(function(result) {
		if(typeof result !== 'undefined' && result !== null) {
			if(!result.finished) {
				var winnerTicket = Math.floor((result.ticketAmount - 0.0000000001) * ((result.percent / 100)));
				var ticketSum = 0;
				var winner = null;
				loop: { for(var deposit in result.deposits) {
					var ticketSumB = ticketSum;
					ticketSum += deposit.tickets;
					if(ticketSumB <= winnerTicket && winnerTicket <= ticketSum) {
						winner = deposit;
						break loop;
					}
				} }
				logger.info("Drew round " + result._id + ", winning ticket is " + winnerTicket + ", winner: " + deposit.user);
				database.updateWinner(result._id, deposit.user, function(results) {
					socket.sendRoundUpdate(round);
					updateCurrentRound();
				});
			} else {
				logger.info("Attempted to draw round " + result._id + " but round was already drawn.");
			}
		} else {
			logger.info("Attempted to draw round but no round could be found.");
			createRound();
		}
	});
}

function doRoundCycle() {
	if(currentid === -1) {
		
	} else {
		getCurrentRound(function(round) {
			if(typeof round !== 'undefined' && round !== null) {
				if(!round.finished) {
					var winnerTicket = Math.floor((round.ticketAmount - 0.0000000001) * ((round.percent / 100)))
					var ticketSum = 0;
					var winner = null;
					loop: { for(var deposit in round.deposits) {
						var ticketSumB = ticketSum;
						ticketSum += deposit.tickets;
						if(ticketSumB <= winnerTicket && winnerTicket <= ticketSum) {
							winner = deposit;
							break loop;
						}
					} }
					if(winner === null) {
						logger.error(currentid + "," + round._id + "a");
					} else {
						database.updateWinner(currentid, deposit.user, function(results) {
							//TODO
						});
					}
				}
			}
			currentid = -1;
			doRoundCycle();
		});
	}
}

module.exports = Game;