var rounds = {};
var gameMeta = {};
var betInv = [];
var steamInv = null;
var userInv = null;
var steamInvReload = -1;
var userInvReload = -1;

if(typeof user !== "undefined" && user !== null) {
	userInv = {
		"err": null,
		"result": user.inventory
	};
	userInvReload = Date.now();
}

/* MECHANICS */

$('#deposit-modal').on('show.bs.modal', function() {
	$('#deposit-modal .modal-header .inventory-price').css('display', 'none');
	$('#deposit-modal .sk-circle').css('display', 'block');
	$('#deposit-modal .user-items').html('');
	$('#modal-depositbutton').html('Loading...');
	$('#modal-depositbutton').addClass('disabled');
});
$('#deposit-modal').on('shown.bs.modal', function() {
	if(typeof user.tradeurl === 'undefined' || user.tradeurl == null || typeof user.tradeurl.id === 'undefined' || user.tradeurl.id == null || user.tradeurl.id.length < 8 || typeof user.tradeurl.token === 'undefined' || user.tradeurl.token == null ||  user.tradeurl.token.length < 8) {
		window.location = '/account?c=deposit';
	} else {
		if(steamInv === null || steamInv.err !== null || steamInvReload == -1 || steamInvReload >= 300000) {
			requestSteamInventory();
		} else {
			updateDepositModal(steamInv);
		}
	}
});
$('#item-select-modal').on('show.bs.modal', function() {
	$('#item-select-modal .sk-circle').css('display', 'block');
	$('#item-select-modal .user-items').html('');
	$('#modal-addbutton').html('Loading...');
	$('#modal-addbutton').addClass('disabled');
});
$('#item-select-modal').on('shown.bs.modal', function() {
	if(typeof user.tradeurl === 'undefined' || user.tradeurl == null || typeof user.tradeurl.id === 'undefined' || user.tradeurl.id == null || user.tradeurl.id.length < 8 || typeof user.tradeurl.token === 'undefined' || user.tradeurl.token == null ||  user.tradeurl.token.length < 8) {
		window.location = '/account?c=deposit';
	} else {
		$('#modal-inventorybutton').click(function() {
			$('#item-select-modal').modal('hide');
			$('#deposit-modal').modal();
		});
		if(userInv === null || userInv.err !== null || (Date.now() - userInvReload) >= 300000) {
			requestUserInventory();
		} else {
			updateBetModal(userInv);
		}
	}
});

/* DISPLAYING */

function updateDepositModal(msg) {
	if(!($('#deposit-modal').data('bs.modal') || {}).isShown) return;
	$('#deposit-modal .sk-circle').css('display', 'none');

	steamInv = msg;

	if(msg.err !== null) {
		$('#deposit-modal .modal-body .user-items').html('<p>An error occured while loading your inventory: ' + msg.err + '</p>');
		$('#modal-depositbutton').html('Deposit (0 items)');
		$('#modal-depositbutton').addClass('disabled');
	} else {
		steamInvReload = Date.now();
		var inventory = JSON.parse(msg.result);
		var inventoryValue = 0.00;
		$.each(inventory, function(key, value) {
   			inventoryValue += value.price;
			$('#deposit-modal .modal-body .user-items').html($('#deposit-modal .modal-body .user-items').html() + buildInventoryItem(value));
		});
		$('#deposit-modal .modal-header .inventory-price').html('Your Inventory: $' + inventoryValue.toFixed(2));
		$('#deposit-modal .modal-header .inventory-price').css('display', 'inline');
		$('#modal-depositbutton').html('Deposit (0 items)');
		$('#modal-depositbutton').addClass('disabled');

		var selectedItems = [];
		$('#deposit-modal .user-item-box').click(function() {
			if($(this).hasClass('selected')) {
				var thisItem = $(this);
				thisItem.removeClass('selected');
				var i = 0;
				var itemIndex = -1;
				selectedItems.forEach(function(item) {
					if(item.assetid == parseInt(thisItem.data('assetid'))) {
						itemIndex = i;
					}
					i++;
				});
				if(itemIndex > -1) {
					selectedItems.splice(itemIndex, 1);
				}
			} else {
				if(selectedItems.length == 15)
					return;
				var thisItem = $(this);
				thisItem.addClass('selected');
				var selectedItem = null;
				inventory.forEach(function(item) {
					if(item.assetid == parseInt(thisItem.data('assetid'))) {
						selectedItem = item;
					}
				});
				if(selectedItem !== null) {
					selectedItems.push(selectedItem);
				}
			}

			var selectedValue = 0.00;
			selectedItems.forEach(function(item) {
				selectedValue += item.price;
			});
			if(selectedItems.length < 1) {
				$('#modal-depositbutton').html('Deposit (0 items)');
				$('#modal-depositbutton').addClass('disabled');
			} else {
				$('#modal-depositbutton').html('Deposit (' + selectedItems.length + ' items - $' + selectedValue.toFixed(2) + ')');
				$('#modal-depositbutton').removeClass('disabled');
			}
		});

		$('#modal-depositbutton').click(function() {
			var thisButton = $(this);
			if(thisButton.hasClass('disabled')) return;

			$('#deposit-modal .modal-header .inventory-price').css('display', 'none');
			$('#deposit-modal .sk-circle').css('display', 'block');
			$('#deposit-modal .modal-body .user-items').html('');
			$('#modal-cancelbutton').css('display', 'none');
			$('#deposit-modal .close').css('display', 'none');
			thisButton.html('Sending offer...');
			thisButton.addClass('disabled');

			requestDepositOffer(selectedItems);
		});
	}
}
function buildInventoryItem(value) {
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
	var item = '<div class="user-item-box item-' + rarity + '" data-classid="' + value.classid + '" data-instanceid="' + value.instanceid + '" data-assetid="' + value.assetid + '">';
	item += '<h5 class="user-item-title">' + value.name + '</h5>';
	item += '<h6 class="user-item-specs">' + wear + '</h6>';
    item += '<img class="user-item-image" src="//steamcommunity-a.akamaihd.net/economy/image/' + value.icon_url + '/134fx84f">';
    item += '<h4 class="user-item-price">$' + value.price.toFixed(2) + '</h4></div>';

	return item;
}
function updateDepositStatus(msg) {
	$('#deposit-modal .sk-circle').css('display', 'none');
	$('#deposit-modal').modal('hide');
	$('#deposit-success-modal').modal();

	if(msg.err !== null) {
		$('#deposit-success-modal .modal-header .modal-title').html('Oh snap!');
		$('#deposit-success-modal .modal-body').html('<p>An error occured while sending your deposit offer: ' + msg.err + '</p>');
	} else {
		$('#deposit-success-modal .modal-header .modal-title').html('Yay!');
		if(msg.result === 'pending') {
			$('#deposit-success-modal .modal-body').html('<p>Your offer was sent! Check your trade offers to accept your deposit. (It may take up to 5 minutes!)</p>');
		} else {
			$('#deposit-success-modal .modal-body').html('<p>Your offer was sent! Check out this link to accept it: <a target="_blank" href="https://steamcommunity.com/tradeoffer/' + msg.result + '">https://steamcommunity.com/tradeoffer/' + msg.result + '</a></p>');
			socket.on('offerstatus', function(msg) {
				if(msg.status === 'accepted') {
					$('#deposit-success-modal .modal-content').removeClass('has-failed');
					$('#deposit-success-modal .modal-content').addClass('has-success', 1000);
					$('#deposit-success-modal .modal-body').html('<p>Your deposit was successful. The items are now in your inventory. Have fun! :)</p>');
				} else {
					$('#deposit-success-modal .modal-content').removeClass('has-success');
					$('#deposit-success-modal .modal-content').addClass('has-failed', 1000);
					$('#deposit-success-modal .modal-header .modal-title').html('Oh snap!');
					$('#deposit-success-modal .modal-body').html('<p>It seems like your deposit was not successful. It could have worked nonetheless, so please check your inventory or try again! :)</p>');
				}
				$('#deposit-success-modal .modal-footer button').removeClass('btn-success');
				$('#deposit-success-modal .modal-footer button').addClass('btn-default');
			});
		}
	}
}
function updateBetModal(msg) {
	if(!($('#item-select-modal').data('bs.modal') || {}).isShown) return;
	$('#item-select-modal .sk-circle').css('display', 'none');

	userInv = msg;

	if(msg.err !== null) {
		$('#item-select-modal .modal-body .user-items').html('<p>An error occured while loading your inventory: ' + msg.err + '</p>');
		$('#modal-addbutton').html('Add');
		$('#modal-addbutton').addClass('disabled');
	} else {
		userInvReload = Date.now();
		$('#item-select-modal .user-items').html('');
		var inventory = msg.result;
		var inventoryValue = 0.00;
		$.each(inventory, function(key, v) {
			$.each(v, function(key, value) {
				var same = false;
			    betInv.forEach(function(i) {
			    	if(i.assetid == value.assetid) same = true;
			    });
			    if(!same) {
			    	inventoryValue += value.price;
			    	$('#item-select-modal .modal-body .user-items').html($('#item-select-modal .modal-body .user-items').html() + buildInventoryItem(value));
			    }
			});
		});
		$('#modal-addbutton').html('Add');
		$('#modal-addbutton').addClass('disabled');

		var selectedItems = [];
		$('#item-select-modal .user-item-box').click(function() {
			if($(this).hasClass('selected')) {
				var thisItem = $(this);
				thisItem.removeClass('selected');
				var i = 0;
				var itemIndex = -1;
				selectedItems.forEach(function(item) {
					if(item.assetid == parseInt(thisItem.data('assetid'))) {
						itemIndex = i;
					}
					i++;
				});
				if(itemIndex > -1) {
					selectedItems.splice(itemIndex, 1);
				}
			} else {
				if(selectedItems.length == (15-betInv.length))
					return;
				var thisItem = $(this);
				thisItem.addClass('selected');
				var selectedItem = null;
				$.each(inventory, function(key, v) {
					$.each(v, function(key, value) {
						if(value.assetid == parseInt(thisItem.data('assetid'))) {
							selectedItem = value;
						}
					});
				});
				if(selectedItem !== null) {
					selectedItems.push(selectedItem);
				}
			}

			var selectedValue = 0.00;
			selectedItems.forEach(function(item) {
				selectedValue += item.price;
			});
			if(selectedItems.length < 1) {
				$('#modal-addbutton').html('Add');
				$('#modal-addbutton').addClass('disabled');
			} else {
				$('#modal-addbutton').html('Add (' + selectedItems.length + ' items - $' + selectedValue.toFixed(2) + ')');
				$('#modal-addbutton').removeClass('disabled');
			}
		});
		$('#modal-addbutton').click(function() {
			var thisButton = $(this);
			if(thisButton.hasClass('disabled')) return;
			var amBefore = betInv.length;

			$.merge(betInv, selectedItems);
			selectedItems = [];
			$('#item-select-modal').modal('hide');

			var html = '';
			betInv.forEach(function(item) {
				var wear = '';
				$.each(item.tags, function(key, val) {
					if(val.internal_name.startsWith('WearCategory'))
						wear = val.name.match(/\b(\w)/g).join('');
				});
				html += '<div class="item-box" data-classid="' + item.classid + '" data-instanceid="' + item.instanceid + '" data-assetid="' + item.assetid + '"><p class="item-title">' + item.name.substring(item.name.indexOf('|') + 1, item.name.length) + '</p><img class="item-image" src="//steamcommunity-a.akamaihd.net/economy/image/' + item.icon_url + '/72fx45f"><p class="item-price">' + wear + ' | $' + item.price.toFixed(2) + '</p><button type="button" class="close" aria-label="Remove"><span>&times;</span></button></div>';
			});
			if(betInv.length < 15) {
				html += '<div id="selector-add" class="item-box" data-toggle="modal" data-target="#item-select-modal"><span class="glyphicon glyphicon-plus" style="font-size: 1.3em;"></span><span>Add items</span></div>';
			}
			$('.jackpot-deposit .item-selector').html(html);

			if(amBefore < 1) {
				$('#item-select-modal').on('hidden.bs.modal', function() {
					$('.jackpot-deposit #bet-button').css('display', 'block');
					$('.jackpot-deposit #bet-button').animate({
						'margin-top': 0
					}, 700, "easeOutBounce");
				});
			}

			$('.item-selector .close').click(function onItemRemove() {
				var thisButton = $(this);
				var toDelete = null;
				betInv.forEach(function(item) {
					if(item.assetid == parseInt(thisButton.parent().data('assetid'))) {
						toDelete = item;
					}
				});
				if(toDelete !== null) {
					betInv.splice(betInv.indexOf(toDelete), 1);
					var html = '';
					betInv.forEach(function(item) {
						html += '<div class="item-box" data-classid="' + item.classid + '" data-instanceid="' + item.instanceid + '" data-assetid="' + item.assetid + '"><p class="item-title">' + item.name.substring(item.name.indexOf('|') + 1, item.name.length) + '</p><img class="item-image" src="//steamcommunity-a.akamaihd.net/economy/image/' + item.icon_url + '/72fx45f"><p class="item-price">$' + item.price.toFixed(2) + '</p><button type="button" class="close" aria-label="Remove"><span>&times;</span></button></div>';
					});
					if(betInv.length < 15) {
						html += '<div id="selector-add" class="item-box" data-toggle="modal" data-target="#item-select-modal"><span class="glyphicon glyphicon-plus" style="font-size: 1.3em;"></span><span>Add items</span></div>';
					}
					if(betInv.length < 1) {
						$('.jackpot-deposit').animate({
							'margin-bottom': '38px'
						}, 700, "easeInOutQuint", function() {
							$('.jackpot-deposit').css('margin-bottom', '0');
						});
						$('.jackpot-deposit #bet-button').animate({
							'margin-top': -75,
							'opacity': 0
						}, 700, "easeInOutQuint", function() {
							$('.jackpot-deposit #bet-button').css('display', 'none');
							$('.jackpot-deposit #bet-button').css('opacity', '1');
						});
					}
					$('.jackpot-deposit .item-selector').html(html);
					$('.item-selector .close').click(onItemRemove);
				}
			});
		});
	}
}
function updateRound(round) {
	rounds[round._id] = round;
	var roundsLength = Object.keys(rounds).length;
	var html = '';
	for(var i in rounds) {
		html = "<hr>" + buildRound(rounds[i]) + html;
		if(i == (roundsLength - 1)) {
			html = buildRoundInformation(round) + html;
		}
	}
	$('.jackpot-list').html(html);
}
function buildRoundInformation(round) {
	var html =	'<div class="deposits">'
			 +	'<h2 class="jackpot-heading">Jackpot #' + round._id + '</h2>';

	var tickets = 0;
	var userTickets = 0;
	for(var deposit in round.deposits) {
		tickets += deposit.tickets;
		if(typeof user !== "undefined" && deposit.user === user._id) {
			userTickets += deposit.tickets;
		}
	}
	var userPercent = (userTickets / tickets).toFixed(2);
	if(isNaN(userPercent))
		userPercent = '0.00';
	html += '<h4 class="jackpot-info-text"><b>' + round.deposits.length + ' items</b> worth <b>$' + (tickets / 100).toFixed(2) + '</b></h4>'
		 +	'<h4 class="jackpot-info-text">You bet <b>$' + (userTickets / 100).toFixed(2) + '</b> with a chance of <b>' + userPercent + '%</b></h4>'
		 +	'<div class="jackpot-time">';
	if(round.timer !== -1) {
		var percent = round.timer / gameMeta.roundTime;
		var maxPercent = gameMeta.roundTime * (100 / gameMeta.roundTime);
		html += '<div class="progress"><div class="progress-bar ' + (percent < 0.14*maxPercent ? 'progress-bar-info' : (percent < 0.84*maxPercent ? 'progress-bar-success' : (percent < 0.94*maxPercent ? 'progress-bar-warning' : 'progress-bar-danger'))) + ' progress-bar-striped active" role="progressbar" '
			 +	'aria-valuenow="' + percent + '" aria-valuemin="0" aria-valuemax="100" style="width:' + percent + '%">-'
			 +	round.timer + 's</div></div>';
	} else {
		html +=	'<div class="progress"><div class="progress-bar" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width:100%; background-color: #fff; color: #000;">No bets yet...</div></div>';
	}
	if(!round.finished || typeof user === "undefined" || user == null) {
		html += '</div><div class="jackpot-deposit">';
		if(typeof user === 'undefined' || user == null) {
			html += '<button class="btn btn-success" onclick="window.location=\'/auth/steam\'" type="button">Login to Deposit</button>';
		} else {
			html += '<div class="selector-container"' + (userInv !== null && Object.keys(userInv.result).length > 0 ? '' : ' style="display: none;"') + '><div class="item-selector"><div id="selector-add" class="item-box" data-toggle="modal" data-target="#item-select-modal"><span class="glyphicon glyphicon-plus" style="font-size: 1.3em;"></span><span>Add items</span></div></div></div>'
				 +	'<button class="btn btn-success" type="button" ' + (userInv !== null && Object.keys(userInv.result).length > 0 ? 'id="bet-button">Bet...' : 'id="deposit-button" data-toggle="modal" data-target="#deposit-modal">Add items to inventory...') + '</button>';
		}
	}
	html += '</div></div>';
	return html;
}
function buildRound(round) {
	var html = '<div class="new-round alert alert-blue">'
		 +	'<div class="round-info">'
		 +	'<span>Round <b>#' + round._id + '</b> started with hash <span class="amount">' + round.hash + '</span>.</span>'
		 +	'</div></div></div>';

	var tickets = 0;
	if(typeof round.deposits !== "undefined" && round.deposits !== null) {
		for(var deposit in round.deposits.reverse()) {
			var user = round.players[deposit.user];
			var ticketsBefore = tickets;
			tickets += deposit.tickets;
			html = 	'<div class="deposit">'
				 +	'<img class="profile-pic" style="background: #' + user.color + '" src="' + user.avatar + '">'
				 +	'<span><b>' + user.displayName + '</b> bet <span class="amount">' + deposit.items.length + ' items</span> worth <span class="amount">$' + (deposit.tickets / 100) + '</span> [<b>Tickets ' + ticketsBefore + '-' + tickets + '</b>].</span>'
				 +	'</div>' + html;
		}
	}
	if(round.finished) {
		var userTickets = 0;
		for(var deposit in round.deposits) {
			if(deposit.user === round.winner)
				userTickets += deposit.tickets;
		}
		html =  '<div class="new-round alert alert-green">'
			 +	'<div class="winner">'
			 + 	'<img class="profile-pic" style="background: #' + user.color + '" src="' + user.avatar + '">'
			 +	'<span><b>' + user.displayName + '</b> won <span class="amount">$' + (tickets / 100).toFixed(2) + '</span> with a chance of <span class="amount">' + (userTickets / tickets).toFixed(2) + '%</span> [<b>Winning ticket: ' + round.percent + '</b>].</span>'
			 +	'</div></div>' + html;
	}
	html = '<div class="deposits">' + html;
	return html;
}