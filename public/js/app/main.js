APP.init = function() {
  $(document).ready(function() {
    if(APP.page == 'deposit') {
      APP.socket.loadSteamInventory(APP.display.addDepositScreenItems);
    }
  });
};

APP.init();
