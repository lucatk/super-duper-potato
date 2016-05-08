APP.display = {};

APP.display.setupDisplay = function() {
	$(document).ready(function() {
		/* Getting height of content for usage in  */
		APP.display.contentHeight = $('.main-container').outerHeight()-95;
		/* Setting max width of main container so animation works  */
		$('.main-container').css('max-width', ($('.main-container').outerWidth() + 1) + 'px');

		APP.display.setupHistoryBar();
		APP.display.registerEvents();
	});
};

APP.display.registerEvents = function() {
	/* Event for "Add items to bet" button */
	$('.add-items a').click(function() {
		APP.display.showBetScreen();
		APP.game.loadUserInventory(APP.display.addBetScreenItems);
	});
};

APP.display.setupHistoryBar = function() {
	APP.display.historyBar = {};
	APP.display.historyBar.itemHeight = $('.history-item').outerHeight();
	APP.display.historyBar.historyItemCount = Math.floor(APP.display.contentHeight / APP.display.historyBar.itemHeight);
	/* Setting max height of history container so animation works  */
	$('.jackpot-history').css('max-height', ($('.jackpot-history').outerHeight() + 1) + 'px');
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

	$('.add-items a').fadeOut(400);
	$('.jackpot-info').fadeOut(700);
	$('.jackpot-listing').fadeOut(700);

	setTimeout(function() {
		var html = '<div class="inventory-content">';
		html +='<div class="item-box"><p class="item-title">AK-47 | Redline</p><img class="item-image" src="http://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV09-5lpKKqPrxN7LEm1Rd6dd2j6eQ9N2t2wK3-ENsZ23wcIKRdQE2NwyD_FK_kLq9gJDu7p_KyyRr7nNw-z-DyIFJbNUz/80fx60f"><p class="item-info">FT | $5.49</p></div>'
		html += '</div><div class="deposit-footer"><a>Cancel</a><button type="submit" class="btn btn-primary" disabled>Add to deposit...</button></div>';
		$('.jackpot-deposit').html($('.jackpot-deposit').html() + html);
		$('.deposit-footer a').click(function() {
			APP.display.hideBetScreen();
		});
		$('.item-box').click(function() {
			$(this).toggleClass('checked');
		});
		$('.jackpot-deposit').children().not('.add-items').hide();
		$('.jackpot-deposit').children().not('.add-items').fadeIn(300);
	}, 500);
};

APP.display.hideBetScreen = function() {
	$('.inventory-content').remove();
	$('.deposit-footer').remove();

	$('.add-items a').fadeIn(400);
	$('.jackpot-info').fadeIn(700);
	$('.jackpot-listing').fadeIn(700);

	$('.jackpot-info').css('margin-top', '40px');
	$('.jackpot-listing').css('margin-top', '30px');
	$('.jackpot-deposit').css({
		'-webkit-transition': 'min-height 1.2s',
		'-moz-transition': 'min-height 1.2s',
		'-o-transition': 'min-height 1.2s',
		'-ms-transition': 'min-height 1.2s',
		'transition': 'min-height 1.2s',
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
		$('.add-items a').click(function() {
			APP.display.showBetScreen();
			APP.game.loadUserInventory(APP.display.addBetScreenItems);
		});
		$('.main-container').css({
			'overflow-y': 'visible'
		});
	}, 100);
};

APP.display.addBetScreenItems = function(items) {

};

APP.display.setupDisplay();
