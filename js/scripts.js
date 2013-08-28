jQuery(document).ready(function($) {
	// var ptmain = $('#ptg-main').PageTransitionGrid();

	options = {
		debugmessages: true,
		navRightText:'RIGHT',
		navLeftText:'LEFT',
		navUpText:'UP',
		navDownText:'DOWN'
	}
	var ptmain = new PageTransitionGrid('#ptg-main', options);

	ptmain.init({
		init: function(el) {
			console.log('INITIALIZED BABY');
			console.log(el);
		},
    after: function(obj) {
      ptmain.menu.removeClass('ptg-nav--active');
      $(ptmain.menu[obj.currBox]).addClass('ptg-nav--active');
    },
		onAnimationEnd: function(obj) {

		}
	});

	ptmain.menu = $('#navigation a');

  if (ptmain.menu.length) {
		ptmain.menu.each(function(i, e) {

      $(this).click(function(e) {
        e.preventDefault();
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
