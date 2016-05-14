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
	$('.add-items a').off('click').on('click', function() {
		APP.display.showBetScreen();
		APP.socket.loadUserInventory(APP.handleUserInventory);
	});
	$('.deposit-footer a').off('click').on('click', function() {
		APP.display.hideBetScreen();
	});
	$('.item-box').off('click').on('click', function() {
		var selectedItem = null;
		var thisItem = $(this);
		APP.inventory.forEach(function(item) {
			if(item.assetid == parseInt(thisItem.data('assetid'))) {
				selectedItem = item;
			}
		});
		if(!thisItem.hasClass('checked')) {
			if(APP.page == 'home' && APP.selectedItems.length >= 15)
				return;
			if(selectedItem !== null) {
				APP.selectedItems.push(selectedItem);
			}
		} else {
			var i = 0;
			var itemIndex = -1;
			APP.selectedItems.forEach(function(item) {
				if(item.assetid == parseInt(thisItem.data('assetid'))) {
					itemIndex = i;
				}
				i++;
			});
			if(itemIndex > -1) {
				APP.selectedItems.splice(itemIndex, 1);
			}
		}
		thisItem.toggleClass('checked');
		$('.deposit-footer > button').prop('disabled', APP.selectedItems.length < 1);
	});
	$(window).off('resize').on('resize', function() {
		APP.display.handleSizes();
	});
	$('[data-toggle="popover"]').popover();
	$('.deposit-footer button').on('shown.bs.popover', function() {
		APP.display.registerEvents();
	});
	$('.popover .confirm-deposit-button').off('click').on('click', function() {
		APP.display.showDepositPending('<p>Sending your deposit offer! This can take up to 2 minutes.</p>');
		APP.socket.sendDepositOffer(APP.selectedItems, APP.display.updateDepositStatus);
	});
	$('.check-offer-button').off('click').on('click', function() {
		var html = $('.check-offer-button').wrap('<p/>').parent().html();
		$('.check-offer-button').unwrap();
		APP.display.showDepositPending('<p>Waiting for your deposit offer to be accepted! This can take up to 5 minutes.</p>' + html);
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
		var html = '<div class="inventory-content"><div class="loading-container"><i class="fa fa-circle-o-notch fa-spin fa-3x fa-fw margin-bottom"></i><span class="sr-only">Loading...</span></div><div class="inventory-container"></div></div><div class="deposit-footer"><a>Cancel</a><button type="submit" class="btn btn-primary" disabled>Add to deposit...</button></div>';
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

APP.display.addBetScreenItems = function() {
	var inventory = APP.inventory;
	var invHtml = '';
	$.each(inventory, function(key, value) {
		invHtml += APP.display.buildInventoryItem(value);
	});
	setTimeout(function() {
		$('.inventory-content .inventory-container').hide();
		$('.inventory-content .inventory-container').html(invHtml);
		$('.inventory-content .inventory-container').waitForImages(function(){
			$('.loading-container').remove();
		  $(this).show();
		});
		APP.display.registerEvents();
	}, 501);
};

APP.display.addDepositScreenItems = function() {
	var inventory = APP.inventory;
	var inventoryValue = 0.00;
	var invHtml = '';
	$.each(inventory, function(key, value) {
		invHtml += APP.display.buildInventoryItem(value);
		inventoryValue += value.price;
	});
	setTimeout(function() {
		$('.inventory-content .inventory-container').hide();
		$('.inventory-content .inventory-container').html(invHtml);
		$('.inventory-content .inventory-container').waitForImages(function(){
			$('.loading-container').remove();
		  $(this).show();
			$('.inventory-amount').html('Your inventory: $' + inventoryValue.toFixed(2));
		});
		APP.display.registerEvents();
	}, 501);
};

APP.display.showDepositPending = function(message) {
	$('.inventory-amount').remove();
	$('.deposit-footer').remove();
	$('.deposit-container').html('<div class="loading-container"><i class="fa fa-refresh fa-spin fa-3x fa-fw"></i></div>' + message);
};

APP.display.updateDepositStatus = function(msg) {
	if(typeof msg.err !== 'undefined' && msg.err !== null) {
		$('.deposit-container').html('<div class="loading-container"><i class="fa fa-exclamation fa-3x fa-fw"></i></div><p>An error occured while sending your deposit offer: ' + msg.err + '</p><button class="btn btn-primary" role="button" onclick="window.location.reload()">Retry</button>');
	} else {
		var html;
		if(typeof msg.status !== 'undefined' && msg.status !== null) {
			if(msg.status === 'accepted') {
				html = '<div class="loading-container"><i class="fa fa-check fa-3x fa-fw"></i></div><p>Success! Your deposit offer was accepted. Click the button below to start playing. Have fun!</p><button class="btn btn-primary" role="button" onclick="window.location.href=\'http://localhost:3030/\'">Play now</button>';
			} else {
				html = '<div class="loading-container"><i class="fa fa-exclamation fa-3x fa-fw"></i></div><p>Aww :( Your deposit offer got cancelled. We hope you still love us! <3</p>';
			}
		} else {
			html = '<div class="loading-container"><i class="fa fa-check fa-3x fa-fw"></i></div><p>We sent you the deposit offer, now you only have to accept it! ';
			if(msg.result === 'pending') {
				html += 'Unfortunately we could not get the link for you, so you have to check for yourself.</p>';
			} else {
				html += 'But no worries, we got you covered: just click the button below and it is magically gonna take you to the offer!</p><button class="check-offer-button btn btn-primary" role="button" onclick="window.open(\'https://steamcommunity.com/tradeoffer/' + msg.result + '\')">Go to offer</button>';
			}
		}
		$('.deposit-container').html(html);
		APP.display.registerEvents();
	}
};

APP.display.setupDisplay();
