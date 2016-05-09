APP.display = {};

APP.display.setupDisplay = function() {
	$(document).ready(function() {
		/* Getting height of content for usage in  */
		APP.display.contentHeight = $('.main-container').outerHeight()-95;
		/* Setting max width of main container so animation works  */
		$('.main-container').css('max-width', ($('.main-container').outerWidth() + 1) + 'px');

		APP.display.setupHistoryBar();
		APP.display.handleSizes();
		APP.display.registerEvents();
	});
};

APP.display.registerEvents = function() {
	/* Event for "Add items to bet" button */
	$('.add-items a').click(function() {
		APP.display.showBetScreen();
		APP.socket.loadUserInventory(APP.display.addBetScreenItems);
	});
	$('.deposit-footer a').click(function() {
		APP.display.hideBetScreen();
	});
	$('.item-box').click(function() {
		$(this).toggleClass('checked');
	});
	$(window).resize(function() {
		APP.display.handleSizes();
	});
};

APP.display.handleSizes = function() {
		/* Resetting max sizes so we can readjust them back to their supposed value */
		$('.main-container, .jackpot-history').css({
			'max-width': '',
			'max-height': ''
		});
		/* Getting height of content for usage in  */
		APP.display.contentHeight = $('.main-container').outerHeight()-95;
		/* Setting max width of main container so animation works  */
		$('.main-container').css('max-width', ($('.main-container').outerWidth() + 1) + 'px');
		/* Setting max height of history container so animation works  */
		$('.jackpot-history').css('max-height', ($('.jackpot-history').outerHeight() + 1) + 'px');
};

APP.display.setupHistoryBar = function() {
	APP.display.historyBar = {};
	APP.display.historyBar.itemHeight = $('.history-item').outerHeight();
	APP.display.historyBar.historyItemCount = Math.floor(APP.display.contentHeight / APP.display.historyBar.itemHeight);
};

APP.display.renderJackpotDraw = function(draws) {
	/* Generating jackpot draw bar */
	var html = '<div class="listing-item"><div class="draw-indicator"></div><div class="draw-container">';
	for(var i = 0; i < draws.length; i++) html += '<img class="draw-avatar" src="' + draws[i].avatar + '">';
	for(var i = 0; i < draws.length; i++) html += '<img class="draw-avatar" src="' + draws[i].avatar + '">';
	for(var i = 0; i < draws.length; i++) html += '<img class="draw-avatar" src="' + draws[i].avatar + '">';
	return html + "</div></div>";
};

APP.display.animateJackpotDraw = function(winner, animation) {
	var offset = 100*38 + winner*38 + chance.integer({min: -1, max:22});
	if(!animation) $('.draw-container').addClass('notransition');
	$('.draw-container').css('margin-left', '-' + offset + 'px');
	if(!animation) $('.draw-container').removeClass('notransition');
};

APP.display.showBetScreen = function() {
	$('.main-container').css({
		'max-height': $('.main-container').height() + 'px',
		'overflow-y': 'hidden'
	});

	$('.jackpot-info').css('margin-top', '-' + ($('.jackpot-info').height() + 20) + 'px');
	$('.jackpot-listing').css('margin-top', '48px');
	$('.jackpot-deposit').css('min-height', $('.jackpot-deposit').height() + 'px');
	$('.jackpot-deposit').css({
		'margin-top': '48px',
		'min-height': ($('.main-container').height() - 96) + 'px'
	});

	$('.add-items').fadeOut(400);
	$('.jackpot-info').fadeOut(700);
	$('.jackpot-listing').fadeOut(700);

	setTimeout(function() {
		var html = '<div class="inventory-content"><div class="inventory-container"></div></div><div class="deposit-footer"><a>Cancel</a><button type="submit" class="btn btn-primary" disabled>Add to deposit...</button></div>';
		$('.jackpot-deposit').html($('.jackpot-deposit').html() + html);
		$('.item-box').click(function() {
			$(this).toggleClass('checked');
		});
		$('.jackpot-deposit').children().not('.add-items').hide();
		$('.jackpot-deposit').children().not('.add-items').fadeIn(300);

		APP.display.registerEvents();
	}, 500);
};

APP.display.hideBetScreen = function() {
	$('.inventory-content').remove();
	$('.deposit-footer').remove();

	$('.add-items').fadeIn(400);
	$('.jackpot-info').fadeIn(700);
	$('.jackpot-listing').fadeIn(700);

	$('.jackpot-info').css('margin-top', '40px');
	$('.jackpot-listing').css('margin-top', '30px');
	$('.jackpot-deposit').css({
		'-webkit-transition': 'min-height 1s',
		'-moz-transition': 'min-height 1s',
		'-o-transition': 'min-height 1s',
		'-ms-transition': 'min-height 1s',
		'transition': 'min-height 1s',
		'min-height': '0px'
	});
	setTimeout(function() {
		$('.jackpot-deposit').css({
			'margin-top': '10px',
			'-webkit-transition': '',
			'-moz-transition': '',
			'-o-transition': '',
			'-ms-transition': '',
			'transition': ''
		});
		$('.main-container').css({
			'overflow-y': 'visible'
		});

		APP.display.registerEvents();
	}, 100);
};

APP.display.buildInventoryItem = function(value) {
	var rarity = '';
	var wear = '';
	$.each(value.tags, function(key, val) {
		if(val.internal_name.startsWith('Rarity_')) {
			rarity = val.name.toLowerCase().split(' ')[0];
		}
		if(val.internal_name.startsWith('WearCategory')) {
			wear = val.name;
		}
	});
	var item = '<div class="item-box" data-classid="' + value.classid + '" data-instanceid="' + value.instanceid + '" data-assetid="' + value.assetid + '"><p class="item-weapon">' + value.name.split(' |')[0] + '</p><p class="item-title">' + value.name.split('| ')[1] + '</p>';
	item += '<img class="item-image" src="//steamcommunity-a.akamaihd.net/economy/image/' + value.icon_url + '/80fx60f">';
	item += '<p class="item-wear">' + wear + '</p><p class="item-price">$' + value.price.toFixed(2) + '</p></div>';

	return item;
};

APP.display.addBetScreenItems = function(msg) {
	var inventory = msg.result;
	var invHtml = '';
	$.each(inventory, function(key, v) {
		$.each(v, function(key, value) {
			invHtml += APP.display.buildInventoryItem(value);
			inventoryValue += value.price;
		});
	});
	setTimeout(function() {
		$('.inventory-content .inventory-container').html(invHtml);
		$('.inventory-amount').html('Your inventory: $' + inventoryValue);
		APP.display.registerEvents();
	}, 501);
};

APP.display.addDepositScreenItems = function(msg) {
	var inventory = JSON.parse(msg.result);
	var inventoryValue = 0.00;
	var invHtml = '';
	$.each(inventory, function(key, value) {
		invHtml += APP.display.buildInventoryItem(value);
		inventoryValue += value.price;
	});
	setTimeout(function() {
		$('.inventory-content .inventory-container').html(invHtml);
		$('.inventory-amount').html('Your inventory: $' + inventoryValue.toFixed(2));
		APP.display.registerEvents();
	}, 501);
};

APP.display.setupDisplay();
