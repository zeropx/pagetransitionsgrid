jQuery(document).ready(function($) {
	// var ptmain = $('#pt-main').PageTransitionGrid();

	var ptmain = new PageTransitionGrid('#pt-main');


	ptmain.init();

	ptnav = $('#navigation a');



	if (ptnav.length) {
			
		ptnav.each(function(i, e) {

			$(this).click(function() {
				var btnID = $(this).attr('id');

				// Remove active class and apply new one
				ptnav.removeClass('ptg-nav--active');
				$(this).addClass('ptg-nav--active');

				ptmain.navigateTo(i);

				// Add ability to target specific object/id
				//ptmain.navigateTo('#col-1');

			});

		});


	};



});	