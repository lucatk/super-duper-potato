var socket = io();

function requestUpdate() {
	socket.on("round", function(msg) {
		updateRound(msg);
	});
	socket.on("meta", function(msg) {
		gameMeta = msg;
	});
	socket.emit("update", {});
}
function requestSteamInventory() {
	socket.on('steaminventory', function(msg) {
		updateDepositModal(msg);
	});
	socket.emit('loadsteaminventory', {});
}
function requestDepositOffer(items) {
	socket.on('offersent', function(msg) {
		console.log('sent');
		updateDepositStatus(msg);
	});
	socket.emit('senddepositoffer', { items: items });
}
function requestUserInventory() {
	socket.on('userinventory', function(msg) {
		updateBetModal(msg);
	});
	socket.emit('loaduserinventory', {});
}

requestUpdate();