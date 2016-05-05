APP.display = {};

APP.display.setupDisplay = function() {
	/* Getting height of content for usage in  */
	APP.display.contentHeight = $('.main-container').outerHeight()-95;
	/* Setting max width of main container so animation works  */
	$('.main-container').css('max-width', ($('.main-container').outerWidth() + 1) + 'px');

	APP.display.setupHistoryBar();
	APP.display.registerEvents();
};

APP.display.registerEvents = function() {
	/* Event for "Add items to deposit" button */
	$('.add-items a').click(function() {
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

		$(this).fadeOut(400);
		$('.jackpot-info').fadeOut(700);
		$('.jackpot-listing').fadeOut(700);

		setTimeout(function() {
			var html = '<div class="inventory-content">';
			html +='<div class="item-box"><p class="item-title">AK-47 | Redline</p><img class="item-image" src="http://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV09-5lpKKqPrxN7LEm1Rd6dd2j6eQ9N2t2wK3-ENsZ23wcIKRdQE2NwyD_FK_kLq9gJDu7p_KyyRr7nNw-z-DyIFJbNUz/80fx60f"><p class="item-info">FT | $5.49</p></div>'
			html += '</div><div class="deposit-footer"><button type="submit" class="btn btn-primary" disabled>Add to deposit...</button></div>';
			$('.jackpot-deposit').html($('.jackpot-deposit').html() + html);
			$('.item-box').click(function() {
				$(this).toggleClass('checked');
			});
			$('.jackpot-deposit').children().not('.add-items').hide();
			$('.jackpot-deposit').children().not('.add-items').fadeIn(300);
		}, 500);
	});
};

APP.display.setupHistoryBar = function() {
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