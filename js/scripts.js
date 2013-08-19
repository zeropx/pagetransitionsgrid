jQuery(document).ready(function($) {
	// var ptmain = $('#pt-main').PageTransitionGrid();

	var ptmain = new PageTransitionGrid('#pt-main');

	ptmain.init();


	ptmain.menu = $('#navigation a');


	if (ptmain.menu.length) {
			
		ptmain.menu.each(function(i, e) {

			$(this).click(function() {
				var btnID = $(this).attr('id');
				if (!ptmain.isAnimating) {
					// Remove active class and apply new one
					ptmain.menu.removeClass('ptg-nav--active');
					$(this).addClass('ptg-nav--active');

					ptmain.navigateTo(i, {
						onComplete: function(x) {
							console.log('completed: ' + x);
						}
					});

					// Add ability to target specific object/id
					//ptmain.navigateTo('#col-1');
				}
			});

		});


	};



});	