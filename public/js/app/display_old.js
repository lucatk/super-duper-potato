var historyItemCount = 0;

function setupHistoryBar() {
	var height = $('.main-container').outerHeight()-95;
	var itemHeight = $('.history-item').outerHeight();
	historyItemCount = Math.floor(height / itemHeight);
	$('.main-container').css('max-width', ($('.main-container').outerWidth() + 1) + 'px');
	$('.jackpot-history').css('max-height', ($('.jackpot-history').outerHeight() + 1) + 'px');
}

$(window).load(function() {
	setupHistoryBar();
	/*setTimeout(function() {
		setTimeout(function() {
			$('.main-container').css('width', '0%');
			$('.main-container').css('margin-left', ($('.main-container').outerWidth()/1.25) + 'px');
		}, 450);
		$('.jackpot-history').css('margin-top', ($('.jackpot-history').outerHeight()/2) + 'px');
		$('.jackpot-history').css('max-height', '0px');
	}, 2000);*/
	
	var users = [
		{
			amount: 28900,
			avatar: "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/92/922d1e4a5f5bfc274665dd65f34be4bebade6244.jpg"
		},
		{
			amount: 13678,
			avatar: "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/e4/e48aff629db95e863266c70ab2430d7eb25e1e67.jpg"
		},
		{
			amount: 4589,
			avatar: "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/92/92ce9814f39ad58e0d8624955ca7ed8f75068e7d.jpg"
		},
	];
	var weights = [];
	for(var i = 0; i < users.length; i++) {
		weights[i] = users[i].amount;
	}
	var draws = [];
	for(var i = 0; i < 100; i++) {
		draws[i] = chance.weighted(users, weights);
	}
	console.log(draws);
	var lastWinnerOccurrence = -1;
	var html = '<div class="listing-item"><div class="draw-indicator"></div><div class="draw-container">';
	for(var i = 0; i < draws.length; i++) {
		html += '<img class="draw-avatar" src="' + draws[i].avatar + '">';
		if(draws[i].amount == 13678) {
			lastWinnerOccurrence = i;
		}
	}
	for(var i = 0; i < draws.length; i++) {
		html += '<img class="draw-avatar" src="' + draws[i].avatar + '">';
	}
	for(var i = 0; i < draws.length; i++) {
		html += '<img class="draw-avatar" src="' + draws[i].avatar + '">';
	}
	html += "</div></div>";
	$('.jackpot-listing').html(html + $('.jackpot-listing').html());

	setTimeout(function() {
		var offset = 100*38 + lastWinnerOccurrence*38 + (Math.random() * (21 - 0) + 0);
		$('.draw-container').css('margin-left', '-' + offset + 'px');
	}, 1000);

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
});