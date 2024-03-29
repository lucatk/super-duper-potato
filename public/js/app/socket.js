APP.socket = {};

APP.socket.init = function() {
  APP.socket.handler = io();
};

APP.socket.loadUserInventory = function(callback) {
  APP.socket.handler.on('userinventory', callback);
	APP.socket.handler.emit('loaduserinventory', {});
};

APP.socket.loadSteamInventory = function(callback) {
  APP.socket.handler.on('steaminventory', callback);
	APP.socket.handler.emit('loadsteaminventory', {});
};

APP.socket.sendDepositOffer = function(items, callback) {
  APP.socket.handler.on('offersent', callback);
  APP.socket.handler.on('offerstatus', callback);
	APP.socket.handler.emit('senddepositoffer', { items: items });
};

APP.socket.init();
