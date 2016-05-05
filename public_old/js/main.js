$('.nav-item .dropdown-toggle').click(function() {
	$('.nav-item .dropdown-toggle').toggleClass('on-hover');
});
$(document).click(function() {
	if($('.nav-item .dropdown-toggle').hasClass('on-hover')) {
		$('.nav-item .dropdown-toggle').removeClass('on-hover');
	}
});

$(function(){
    $(".profile-settings form").submit(function(e) {       
      if(!$('.profile-settings .fg-tradeurl').hasClass('has-success')) {
      	e.preventDefault();
      }
    });
});

var data = [
			    {
			        value: 300,
			        color:"#F7464A",
			        highlight: "#FF5A5E",
			        label: "Red"
			    },
			    {
			        value: 50,
			        color: "#46BFBD",
			        highlight: "#5AD3D1",
			        label: "Green"
			    },
			    {
			        value: 100,
			        color: "#FDB45C",
			        highlight: "#FFC870",
			        label: "Yellow"
			    }
			]

window.onload = function(){
	var ctx = document.getElementById("jackpot-chart").getContext("2d");
	window.myDoughnut = new Chart(ctx).Doughnut(data, {responsive : true,
														percentageInnerCutout : 60});
};

var rg = new RegExp("://steamcommunity\.com\/tradeoffer\/new\/\\?partner=[0-9]*&token=[a-zA-Z0-9_-]*");
$('.profile-settings #tradeurl').on('change keyup paste', function() {
	var input = $('.profile-settings #tradeurl').val();
	if(rg.test(input)) {
		$('.profile-settings .fg-tradeurl').removeClass("has-error");
		$('.profile-settings .fg-tradeurl').addClass("has-success");
	} else {
		if(input.length > 0) {
			$('.profile-settings .fg-tradeurl').removeClass("has-success");
			$('.profile-settings .fg-tradeurl').addClass("has-error");
		} else {
			$('.profile-settings .fg-tradeurl').removeClass("has-error");
			$('.profile-settings .fg-tradeurl').removeClass("has-success");
		}
	}
});

$(document).ready(function() {
	var input = $('.profile-settings #tradeurl').val();
	if(rg.test(input)) {
		$('.profile-settings .fg-tradeurl').removeClass("has-error");
		$('.profile-settings .fg-tradeurl').addClass("has-success");
	} else {
		if(input.length > 0) {
			$('.profile-settings .fg-tradeurl').removeClass("has-success");
			$('.profile-settings .fg-tradeurl').addClass("has-error");
		} else {
			$('.profile-settings .fg-tradeurl').removeClass("has-error");
			$('.profile-settings .fg-tradeurl').removeClass("has-success");
		}
	}
});

/*var percent = 0;
var jackpotTimeProgress = function() {
	if(percent == 100) return;

	if(percent == (0.14*meta.)) {
		$('.jackpot-time .progress-bar').removeClass('progress-bar-info', 1000);
	}
	if(percent == 84) {
		$('.jackpot-time .progress-bar').removeClass('progress-bar-success', 1000);
	}
	if(percent == 94) {
		$('.jackpot-time .progress-bar').removeClass('progress-bar-warning', 1000);
	}

	percent = percent + 1;
	$('.jackpot-time .progress-bar').text('-' + (100-percent) + 's');
  	$('.jackpot-time .progress-bar').attr("aria-valuenow", percent);
  	$('.jackpot-time .progress-bar').css({
  		width: percent + '%',
  	});
};
setInterval(jackpotTimeProgress, 1000);*/

$(document).scroll(function() {
	if($(window).width() > 968) {
	    $('.header-container').css(
	    	{
	    		position: $(this).scrollTop() > 50 ? "fixed" : ($(this).scrollTop() < 2 ? "absolute" : "fixed"),
	    		background: $(this).scrollTop() > 50 ? "linear-gradient(rgb(72, 78, 85), rgb(58, 63, 68) 60%, rgb(49, 53, 57))" : ($(this).scrollTop() < 2 ? "linear-gradient(rgba(72, 78, 85, .9), rgba(58, 63, 68, .9) 60%, rgba(49, 53, 57, .9))" : "linear-gradient(rgb(72, 78, 85), rgb(58, 63, 68) 60%, rgb(49, 53, 57))")
	    	});
	    $('.dropdown-menu').attr('style', $(this).scrollTop() > 50 ? 'background: rgb(72, 78, 85) !important' : ($(this).scrollTop() < 2 ? 'background: rgba(72, 78, 85, 0.9) !important' : 'background: rgb(72, 78, 85) !important'));
	}
	/*if($(window).width() > 1024) {
		$('#jackpot-chart').css(
	    	{
	    		position: $(this).scrollTop() > $('#jackpot-chart').position().top ? "fixed" : "static"
	    	});
	    $('.jackpot-list').css(
	    	{
	    		width: $(this).scrollTop() > $('#jackpot-chart').position().top ? "auto" : "60%"
	    	});
	}*/
});