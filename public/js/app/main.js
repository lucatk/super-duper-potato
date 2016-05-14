APP.selectedItems = [];
APP.inventory = [];

APP.init = function() {
  $(document).ready(function() {
    if(APP.page == 'deposit') {
      APP.socket.loadSteamInventory(APP.handleSteamInventory);
    }
  });
};

APP.handleUserInventory = function(msg) {
	$.each(msg.result, function(key, v) {
		$.each(v, function(key, value) {
			APP.inventory.push(value);
		});
	});
  APP.display.addBetScreenItems();
};

APP.handleSteamInventory = function(msg) {
  $.each(JSON.parse(msg.result), function(key, value) {
    APP.inventory.push(value);
  });
  APP.display.addDepositScreenItems();
};

APP.init();
