jQuery(document).ready(function($) {
	// var ptmain = $('#pt-main').PageTransitionGrid();

	options = {
		debugmessages: true,
		navRightText:'RIGHT',
		navLeftText:'LEFT',
		navUpText:'UP',
		navDownText:'DOWN'
	}
	var ptmain = new PageTransitionGrid('#pt-main', options);

	ptmain.init({
		init: function() {
			console.log('INITIALIZED BABY');
		},
		onAnimationEnd: function() {
			// console.log('global')
		}
	});

	ptmain.menu = $('#navigation a');



	if (ptmain.menu.length) {
			
		ptmain.menu.each(function(i, e) {

			$(this).click(function() {
				var btnID = $(this).attr('id');
				if (!ptmain.isAnimating) {
					// Remove active class and apply new one
					ptmain.menu.removeClass('ptg-nav--active');
					$(this).addClass('ptg-nav--active');

     			ptmain.navigateTo(i);

				}
			});

		});


	};



});	