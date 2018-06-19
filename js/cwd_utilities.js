/* CWD Utilities (ama39, last update: 1/23/18)
   - 1. Main Navigation (script support for dropdown menus and mobile)
   - 2. Empty Sidebar Helper (clears whitespace from empty sidebar regions to allow use of the :empty pseudo class in CSS)
   ------------------------------------------------------------------------- */

var mobile_breakpoint = 991; // viewport pixel width at which mobile nav appears (should match the media query in the project's css)
var mobile_expander_breakpoint = 767; // viewport pixel width at which mobile expanders appear (e.g., section nav)
if (!Date.now){Date.now = function now(){return new Date().getTime();};} // legacy Date method shim
var msie = document.documentMode;

(function ($, root, undefined) { $(function () { 'use strict';


	// Window Size Tracking
	function resizeChecks() {

		// Mobile Nav
		if ($(window).width() <= mobile_breakpoint) {
			$('body').addClass('mobile'); // mobile nav breakpoint
		}
		else {
			$('body').removeClass('mobile');
			$('#main-navigation li.parent').removeClass('open');
			$('#main-navigation, #mobile-nav-dimmer').removeAttr('style');
		}
		// Mobile Expanders
		if ($(window).width() > mobile_expander_breakpoint) {
			$('.mobile-expander-heading').each(function() {
				if ( !$(this).hasClass('unit-nav') ) {
					$(this).removeClass('open');
				}
				else if ( $(window).width() > mobile_breakpoint ) {
					$(this).removeClass('open');
					$('.dropdown-menu .open').removeClass('open');
				}
			})
		}
	}
	$(window).resize(resizeChecks);
	resizeChecks();




	// 1. Main Navigation -----------------------------------------------------

	var mousedown = false; // extra control variable for precise click and focus event interaction

	// Utility Navigation (appended for mobile)
	if ($('#utility-navigation li').length > 0) {
		$('#main-navigation ul').first().append('<li class="parent mobile-nav-only"><a class="more-links-button" href="#">More...</a><ul class="list-menu links vertical children more-links"></ul>');
		$('#utility-navigation li').each(function() {
			$('#main-navigation .more-links').append($(this).clone().addClass('mobile-nav-only'));
		});
		$('.more-links-button').click(function(e) {
			e.preventDefault();
		}).mousedown(function(e) {
			mousedown = true;
			$(this).find('.fa').trigger('mousedown');
		});
	}

	// Dropdown Menus
	$('li.menu-item-has-children').addClass('parent'); // WordPress Support
	$('.dropdown-menu li.parent').parent().removeClass('menu').addClass('links list-menu');
	$('.dropdown-menu li.parent > a').wrapInner('<span></span>').append('<span class="fa fa-caret-down"></span>'); // wrap text in a span and add dropdown caret icons
	$('.dropdown-menu li.parent li.parent > a .fa').removeClass('fa-caret-down').addClass('fa-caret-right'); // change sub-dropdown caret icons
	$('.dropdown-menu li.parent > ul').each(function(){
		$(this).removeClass('menu').addClass('list-menu links vertical children');
		if ( !$('body').hasClass('mobile') ) {
			$(this).css('min-width',$(this).parent('li').width()+'px' ); // smart min-width to prevent dropdown from being narrower than its parent
		}
	});
	$('.dropdown-menu li.parent li.parent > ul').removeAttr('style'); // reset min-width to allow smaller submenus
	$('.dropdown-menu li.parent').hover(function(){
		if ( !$('body').hasClass('mobile') ) {
			// horizontal edge-detection
			var submenu_offset = $(this).children('ul').offset();
			if ( submenu_offset.left + $(this).children('ul').width() > $(window).width() ) {
				$(this).children('ul').addClass('flip');
			}
		}
	}, function() {
		if ( !$('body').hasClass('mobile') ) {
			$(this).children('ul').removeClass('flip');
		}
	});
	$('.dropdown-menu li.parent a').focus(function() {
		if ( !$('body').hasClass('mobile') ) {
			// horizontal edge-detection
			var submenu_offset = $(this).closest('.parent').children('ul').offset();
			if ( submenu_offset.left + $(this).closest('.parent').children('ul').width() > $(window).width() ) {
				$(this).closest('.parent').children('ul').addClass('flip');
			}
		}
		if (!mousedown) {
			$(this).parents('.parent').addClass('open');
			$(this).closest('.mobile-expander').children('.mobile-expander-heading').addClass('open');
		}
		mousedown = false;
	}).blur(function() {
		if ( !$('body').hasClass('mobile') ) {
			$(this).parents('.parent').removeClass('open');
			$(this).closest('.mobile-expander').children('.mobile-expander-heading').removeClass('open');
		}
	});

	// Mobile Navigation
	$('.dropdown-menu li.parent > a .fa').click(function(e) {
		e.preventDefault();
		e.stopPropagation();
	}).mousedown(function(e) {
		e.stopPropagation();
		mousedown = true;
		if ( $('body').hasClass('mobile') ) {
			$(this).closest('.parent').toggleClass('open');
		}
	});
	var main_nav_focus_target = $('#mobile-home');
	$('#mobile-nav').click(function(e) {
		e.preventDefault();
		$('.dropdown-menu li.parent').removeClass('open');
		$('#main-navigation, #mobile-nav-dimmer').fadeIn(100,function() {
			$(main_nav_focus_target).focus();
		});
	});
	$('#mobile-home').after('<a id="mobile-close" href="#"><span class="sr-only">Close Menu</span></a>');
	$('#mobile-close').click(function(e) {
		e.preventDefault();
		$('#main-navigation, #mobile-nav-dimmer').fadeOut(100,function() {
			$('#main-navigation li.parent').removeClass('open');
			$('#mobile-nav').focus();
		});
	});
	$('#main-navigation').before('<div id="mobile-nav-dimmer"></div>');
	$('#mobile-nav-dimmer').click(function(e) {
		$('#mobile-close').trigger('click');
	});

	// 2. Empty Sidebar Helper ------------------------------------------------
	$('.secondary').each(function() {
		if (msie != 8 && msie != 7) {
			if ( !$(this).html().trim() ) {
				$(this).empty();
			}
		}
	});


	// 5. Mobile Expander -----------------------------------------------------
	$('.mobile-expander').each(function() {
		$(this).prepend('<a href="#" aria-hidden="true" class="mobile-expander-heading mobile-only"><span class="zmdi zmdi-menu"></span>More in this Section</a>');
		//if ($(this).children('h1, h2, h3, h4, h5, h6').length > 0) {
			var expand_header = $(this).children('.mobile-expander-heading').first();
			$(expand_header).nextAll().wrapAll('<div class="mobile" />');
			$(expand_header).click(function(e) {
				e.preventDefault();
				if ($(window).width() <= mobile_expander_breakpoint) {
					$(this).toggleClass('open');
				}
			});
			$(expand_header).next('.mobile').find('a').focus(function() {
				$(this).parents('.mobile').prev('.mobile-expander-heading').addClass('open');
			}); // TODO: focus and mouse event reconciliation for full keyboard support
		//}
	});

	// 6. Mobile Table Helper -------------------------------------------------
	$('.mobile-scroll').each(function() {
			$(this).wrap('<div class="table-scroller" />');
			if ( $(this).hasClass('large') ) {
				$(this).parent().addClass('large');
			}
	});
	$('.table-scroller').append('<div class="table-fader" />').bind('scroll touchmove', function() {
		$(this).find('.table-fader').remove(); // hide fader DIV on user interaction
	});











});})(jQuery, this);
