/* !! CUSTOMIZED for Data Storage Tool (ama39, 10/16/17) */

/* CWD Modal Popups (ama39, last update: 8/10/17)
	- Displays content as a "popup" overlay, rather than a leaving the current page or opening a new window.
	- Activate on any link by applying a "popup" class (e.g., <a class="popup" href="bigredbear.jpg" alt="Rawr!!">Behold the Big Red Bear!</a>).
	- Supports images, DOM elements by ID, and Iframes (auto-detected from the href attribute).
   - Keyboard and Screen Reader accessible with ARIA dialog bounds, focus control, and key shortcuts.
   - At mobile sizes, DOM Element and Iframe popups will automatically become full-screen and scroll independently.

   - Image Gallery mode:
   - -- Gallery behavior (next/prev) is available for sets of images that share a "data-gallery" attribute.
   - -- When running in Image Gallery mode, a loading animation is provided when transitioning between images.

   - Accessibility Notes:
   - -- Popups have a "dialog" role along with visually-hidden titling, focus control, and tab indexing to smoothly transition to and from the dialog. The titling provides hints on key shortcuts and changes based on the type of content and whether it is the first time the user has launched the popup. See the popupControls() function below for more details.
   - -- When running in Image Gallery mode, Next and Previous buttons (or their key shortcuts) will shift focus to an element with a "progressbar" role. No progress updates are provided dynamically, but it will announce "Loading, 0 percent" and then wait for the image to load (or an error) before shifting back to the popup. This is to prevent focus from being temporarily orphaned during a popup transition on slow connections. On fast connections, it is likely to only read "Loading..." between each image.
   - -- It is recommended that popup links include the ARIA attribute aria-haspopup="true" unless it is part of an interface that has its own accessibility strategy.
   ------------------------------------------------------------------------- */

/* Global Options -------------- */
var popup_shadow = true; // applies a subtle dropshadow (css class "dropshadow")
var popup_fadein_speed = 0.25; // speed of popup fade-in (in seconds)
var popup_max_width = 500; // max width of unconstrained popups (ID popups only)
var popup_max_height = 400; // max height of unconstrained popups (ID popups only)
var popup_proportion = 0.94; // size of unconstrained popups (0.94 = 94% window width and height)
var popup_resize_response = 0; // on window resize, controls how immediately the popup is recalculated (in milliseconds, 0 instructs the browser to resize as rapidly as possible, greater than 0 instructs the browser to only recalculate once at the end of the resize event(s) and after a delay of x milliseconds, set to 100 or more if performance on resize events is an issue)

/* Global Variables ------------ */
var popup_count = 0;
var popup_type = 'none';
var resize_popup;
var was_visible = false;
var popup_source;
var first_popup = true;
var first_gallery = true;
var gallery_running = false;

popup_fadein_speed = popup_fadein_speed * 1000; // convert to milliseconds

/* -----------------------------------------------------------------------------------------
   Initialize Popups
   -----------------------------------------------------------------------------------------
   - Applies to all links with the class "popup"
   - Optionally accepts link attribute "data-popup-width"
   - Optionally accepts link attribute "data-popup-height" (ignored by image popups)
   - For Image Popups:
   - -- Optionally accepts link attribute "data-alt" to include alt text on the image displayed in the popup
   - -- Optionally accepts link attribute "data-title" to display a visible caption
   - -- Optionally accepts link attribute "data-gallery" to associate sets of images and allow forward/back navigation by button or arrow keys
-------------------------------------------------------------------------------------------- */

jQuery(document).ready(function($) {

	function popups() {
		// Create #popup node and background dimmer
		$('body').append('<div id="popup-background" class="aria-target" tabindex="-1" aria-label="Loading..." role="progressbar" aria-valuemax="100" aria-valuemin="0" aria-valuenow="0"><span class="spinner"></span></div><div id="popup-wrapper"><div class="vertical-align"><div id="popup" role="dialog" aria-labelledby="popup-anchor"></div></div></div>');
		// Background space is clickable to close the popup
		$('#popup-wrapper').click(function(e) {
			$('#popup-close').trigger('click');
		});
		// Close key shortcut
		$(document).keyup(function(e) {
			if (e.keyCode == 27) { // escape key
				if ( $('#popup-wrapper:visible') ) {
					$('#popup-close').trigger('click');
				}
			}
		});
		// Gallery functionality (next/prev key shortcuts)
		$(document).keydown(function(e) {
			if ( $('#popup').hasClass('image-gallery') ) {
				if (e.keyCode == 37) { // left key
					e.preventDefault();
					$('#popup .next-prev .prev').trigger('click');
				}
				else if (e.keyCode == 39) { // right key
					e.preventDefault();
					$('#popup .next-prev .next').trigger('click');
				}
			}
		});
		// Gallery swipe left/right functionality (for touch devices, utilizes jquery.detectSwipe plugin)
		$.detectSwipe.preventDefault = false; // it's important to allow default touchmove events, so that scrolling continues to work when needed
		$('#popup').on('swipeleft', function() {
			if ( $('#popup').hasClass('image-gallery') ) {
				$('#popup').addClass('swipe-left');
				$('#popup .next-prev .prev').trigger('click');
			}
		});
		$('#popup').on('swiperight', function() {
			if ( $('#popup').hasClass('image-gallery') ) {
				$('#popup').addClass('swipe-right');
				$('#popup .next-prev .next').trigger('click');
			}
		});

		// Apply dropshadow preference
		if (popup_shadow) {
			$('#popup').addClass('dropshadow');
		}

		// Setup click events to launch popups
		$('.popup').each(function(n) {
			popup_count++;
			$(this).data('popupID',popup_count);

			var popup_content = $(this).attr('href');
			var popup_caption = $(this).attr('data-title');
			var popup_alt = $(this).attr('data-alt');
			var popup_custom_width = $(this).attr('data-popup-width');
			var popup_custom_height = $(this).attr('data-popup-height');
			var popup_gallery = $(this).attr('data-gallery');
			var popup_fullscreen = $(this).hasClass('popup-fullscreen');

			$(this).click(function(e) {

				e.preventDefault();

				$('.popup-active').removeClass('popup-active');
				$(this).addClass('popup-active');
				popup_source = $(this);
				$('#popup, #popup-background').removeClass('image image-gallery');
				$('#popup-background .spinner').removeClass('off');

				if (popup_content != '' && popup_content != undefined) {

					// Apply fullscreen preference
					if (popup_fullscreen) {
						$('#popup').addClass('fullscreen');
					}
					else {
						$('#popup').removeClass('fullscreen');
					}

					// If the popup is already visible (gallery mode), reset size and position to accept new content
					if ( !$('#popup-wrapper:visible') ) {
						$('#popup').removeClass('custom-width custom-height').removeAttr('style').empty();
					}

					// Determine content type (image, element by ID, or external iframe)
					var filetype = popup_content.substr(popup_content.lastIndexOf('.')).toLowerCase();

					// IMAGE Mode
					if (filetype == '.jpg' || filetype == '.jpeg' || filetype == '.gif' || filetype == '.png') {
						popup_type = 'image';
						$('#popup').removeClass('fullscreen');
						$('#popup, #popup-background').addClass('image');
						if (popup_gallery) {
							$('#popup').addClass('image-gallery');
						}

						var img = new Image();
						img.onload = function() {
							$('#popup').removeClass('custom-width custom-height').removeAttr('style');
							$('#popup-wrapper').show(); // parent container must be visible for height calculations

							var this_width = img.width;
							if (popup_custom_width) {
								this_width = popup_custom_width;
							}
							$('#popup').removeClass('scroll').width(this_width).html('<div class="relative"><img id="popup-image" tabindex="-1" class="aria-target" width="'+img.width+'" height="'+img.height+'" src="'+popup_content+'" alt="'+popup_alt+'"></div>');

							if (popup_caption != '' && popup_caption != undefined) {
								$('#popup').append('<p class="caption">'+popup_caption+'</p>');
							}

							// Detect scaled images
							var scaled_height = img.height;
							if (img.width != $('#popup-image').width()) {
								scaled_height = parseInt(scaled_height * ($('#popup-image').width() / img.width));
							}
							$('#popup-image').css({
								'width': $('#popup-image').width()+'px',
								'height': scaled_height+'px'
							});

							$('#popup').click(function(e) {
								e.stopPropagation(); // propagation must be stopped to prevent a click from passing through to #popup-background (which closes the popup)
							});

							$('#popup-image').css({
								'width': 'auto',
								'height': 'auto'
							});

							$('#popup-wrapper').hide();
							popupControls();

							$('#popup-wrapper').fadeIn(popup_fadein_speed, function() {
								if (gallery_running) {
									$('#popup-image').focus();
								}
								else {
									$('#popup-anchor').focus();
								}
								$('#popup-background .spinner').addClass('off');
								gallery_running = true;
							});
						}
						img.onerror = function() {

							// Oh no! Error loading image!
							$('#popup-wrapper').show();
							$('#popup').addClass('error').removeClass('scroll').width(300).html('<div class="relative clearfix"><div id="popup-panel" class="panel dialog no-border" role="alert"><h3 id="popup-error" class="aria-target" tabindex="-1">Error</h3><p><span class="fa fa-image fa-3x fa-pull-left fade" aria-hidden="true"></span> The requested image could not be loaded.</p></div></div>');
							$('#popup-background .spinner').addClass('off');
							popupControls();
							$('#popup-wrapper').hide().fadeIn(popup_fadein_speed, function() {
								$('#popup-error').focus();
							});

						}
						// If the popup is already visible (gallery mode), fade out before fading back in
						if ( $('#popup-wrapper:visible') ) {
							$('#popup-wrapper').fadeOut(popup_fadein_speed, function() {
								$('#popup, #popup-background').removeClass('error swipe-left swipe-right custom-width custom-height');
								img.src = popup_content;
							});
						}
						else {
							img.src = popup_content;
						}

						$('#popup-background').show();

					}
					else {
						$('#popup').removeClass('custom-width custom-height').removeAttr('style').empty();

						// DOM ELEMENT Mode
						if (popup_content.indexOf('#') == 0) {
							popup_type = 'id';

							$(popup_content).after('<div id="id-marker" />');

							// Store original display state
							if ($(popup_content+':visible').length > 0) {
								was_visible = true;
							}
							else {
								was_visible = false;
							}

							if (!popup_fullscreen) {
								var contain_height = popup_max_height;
								if ($(window).height()*popup_proportion < contain_height) {
									contain_height = $(window).height()*popup_proportion;
								}

								var this_width = parseInt($(window).width()*popup_proportion);
								var this_height = contain_height;
								if (popup_custom_width) {
									$('#popup').addClass('custom-width');
									this_width = popup_custom_width;
								}
								if (popup_custom_height) {
									$('#popup').addClass('custom-height');
									this_height = popup_custom_height;
								}
								$('#popup').addClass('scroll').css('max-width',popup_max_width+'px').outerWidth(this_width).outerHeight(this_height).removeClass('fullscreen');

							}
							$('#popup').click(function(e){e.stopPropagation()}).append($(popup_content).show(pswShow()));//popup is shown
							$('#popup-wrapper').fadeIn(popup_fadein_speed, function() {
								$('#popup-anchor').focus();
							});
							$('#popup-background').show();

						}
						else {

							// IFRAME Mode
							popup_type = 'iframe';

							$('#popup').removeClass('scroll').html('<iframe src="' + popup_content + '" frameborder="0" scrolling="auto" />');
							$('#popup iframe').attr('src',$('#popup iframe').attr('src')); // clears IE iframe caching bug

							var this_width = parseInt($(window).width()*popup_proportion);
							var this_height = parseInt($(window).height()*popup_proportion);
							if (popup_custom_width) {
								$('#popup').addClass('custom-width');
								this_width = popup_custom_width;
							}
							if (popup_custom_height) {
								$('#popup').addClass('custom-height');
								this_height = popup_custom_height;
							}
							$('#popup').outerWidth(this_width).outerHeight(this_height);

							$('#popup-wrapper').fadeIn(popup_fadein_speed, function() {
								$('#popup-anchor').focus();
							});
							$('#popup-background').show();
						}

						popupControls(popup_content);
					}

					// Refresh positioning and scale on resize
					if (!popup_fullscreen) {
						$(window).on('resize.popup',function() {
							if (popup_resize_response > 0) {
								clearTimeout(resize_popup);
								resize_popup = setTimeout(resizeDone, popup_resize_response);
							}
							else {
								resizeDone();
							}
						});
						function resizeDone() {
							if (popup_type == 'id') {
								var contain_height = popup_max_height;
								if ($(window).height()*popup_proportion < contain_height) {
									contain_height = $(window).height()*0.94;
								}
								if ( !$('#popup').hasClass('custom-width') ) {
									$('#popup').outerWidth(parseInt($(window).width()*popup_proportion));
								}
								if ( !$('#popup').hasClass('custom-height') ) {
									$('#popup').outerHeight(contain_height);
								}
							}
							else if (popup_type == 'iframe') {
								if ( !$('#popup').hasClass('custom-width') ) {
									$('#popup').outerWidth(parseInt($(window).width()*popup_proportion));
								}
								if ( !$('#popup').hasClass('custom-height') ) {
									$('#popup').outerHeight(parseInt($(window).height()*popup_proportion));
								}
							}
						}
					}
				}
			});
		});
	}
	//popups(); // process the page

	/* Data Storage Tool: Delay popups init until the table is rendered by app.js */
  var popup_ran_once = false;
  $('#comparisonchart').on('DOMSubtreeModified', function(){
    if (!popup_ran_once) {
      popups();
      popup_ran_once = true;
    }
  });

	/* -----------------------------------------------------------------------------------------
		Generate Popup Controls
		-----------------------------------------------------------------------------------------
		- Controls are regenerated for each popup to support all use cases
		- Provides accessibility aids through titling and focus targets
		- All popups get a Close button, image galleries also get Next and Previous buttons (which can also be triggered by keyboard arrows)
	-------------------------------------------------------------------------------------------- */
	function popupControls(popup_content) {

		// The title of the popup (read by screen readers) is more verbose the first time it is triggered, providing a hint to use the Esc key shortcut
		var popup_window_message = 'Popup Window';
		if (first_popup) {
			popup_window_message = 'Popup Window (Press Escape to Exit)';
			first_popup = false;
		}
		// Image gallery popups are given a slightly different title, and also provide more verbose hints the first time
		if ($('#popup').hasClass('image-gallery')) {
			if (first_gallery) {
				popup_window_message = 'Popup Gallery (Press Escape to Exit, Press Left and Right Arrow Keys to Navigate)';
				first_gallery = false;
			}
			else {
				popup_window_message = 'Popup Gallery';
			}
		}

		// Add title and a Close button with all the necessary attributes for focus control
		$('#popup').prepend('<h2 id="popup-anchor" class="hidden" tabindex="-1">'+popup_window_message+'</h2><a href="#" id="popup-close" tabindex="0" aria-label="Close Button"></a>');

		// Add image gallery buttons if applicable (Next and Previous)
		if ($('#popup').hasClass('image-gallery')) {
			$('#popup > .relative').append('<div class="gallery-nav"><div class="next-prev"><a class="prev" href="#"><span class="hidden">Previous Item</span></a><a class="next" href="#"><span class="hidden">Next Item</span></a></div></div>');

			// The calculations below determine which image in a gallery set is active and active the next or previous one
			// (associated keycode events are defined in the popups() function above)
			$('#popup .next-prev a').click(function(e) {
				e.preventDefault();
				e.stopPropagation();
				var gallery_id = $('.popup-active').attr('data-gallery');
				var gallery_length = $('.popup[data-gallery='+gallery_id+']').length;
				var gallery_current_image = $('.popup-active').index('.popup[data-gallery='+gallery_id+']');
				$('#popup-background').focus();
				if ($(this).hasClass('prev')) { // left button
					var next_image = gallery_current_image - 1;
					if (next_image < 0) {
						next_image = gallery_length - 1;
					}
					$('.popup[data-gallery='+gallery_id+']').eq(next_image).trigger('click');
				}
				else { // right button
					var next_image = gallery_current_image + 1;
					if (next_image > gallery_length-1) {
						next_image = 0;
					}
					$('.popup[data-gallery='+gallery_id+']').eq(next_image).trigger('click');
				}
			});
		}

		// Close button event
		$('#popup-close').click(function(e) {
			e.preventDefault();
			e.stopPropagation();
			$(window).unbind('resize.popup');
			$('#popup-wrapper, #popup-background').hide();
			if (popup_type == 'id') { // return page element to its native DOM position
				$('#id-marker').after( $(popup_content) );
				$('#id-marker').remove();
				if (!was_visible) {
					$(popup_content).hide();
				}
			}
			$(popup_source).focus(); // return focus to the original source of the popup
			$('.popup-active').removeClass('popup-active');
			$('#popup').removeClass('image image-gallery error swipe-left swipe-right');
			gallery_running = false;

			//set main content to aria-hidden = "false" and return focus
			pswShow.toggleDialog("hide");
		});
	}

	//psw58 added additional WA functionality to hold focus on pop up, and aria-hide main content
	//taken from  WACG2.0 https://www.w3.org/WAI/GL/wiki/Using_ARIA_role%3Ddialog_to_implement_a_modal_dialog_box
	var dialogOpen = false, lastFocus, dialog, pagebackground;
	//hooked into popup on click event line 262
	function pswShow(el){
		//add tabindex to popup @todo this could be changed to line 56
		$("#popup").attr("tabindex", "-1");

		lastFocus = el || document.activeElement;
		//set focus after 1 second --give the popup time to fade in
		setTimeout(
		    function(){   	
		        $("#popup-close").attr('tabindex', 1);
		        //$(".help").attr('tabindex', 2);
		        toggleDialog('show');
		    }
		 , 1000);	
	      
		//dialog is shown in main popup function
		function toggleDialog(sh) {
			pagebackground = $("div[role='main']").get(0)	
			if (sh == "show") {
				dialogOpen = true;
				// after displaying the dialog, focus an element inside it
				$("#popup").focus();  
				// only hide the background *after* you've moved focus out of the content that will be "hidden"
				pagebackground.setAttribute("aria-hidden","true");
				
			} else {//hide dialog
				dialogOpen = false;
				pagebackground.setAttribute("aria-hidden","false");
				//if last focus is overlay 
				var my_attr = $(lastFocus).attr('data-hidden');
				if ( !my_attr ){
					$(".floating-row-header").hide();
				}
				lastFocus.focus(); 
			}
		}

		document.addEventListener("focus", function(event) {
		    d = document.getElementById("popup");
		    if (dialogOpen && !d.contains(event.target)) {
		        event.stopPropagation();
		        d.focus();
		    }

		}, true);

		document.addEventListener("keydown", function(event) {
		    if (dialogOpen && (event.keyCode == 27 )){
		        toggleDialog('hide');
		    }
		}, true);	

		pswShow.toggleDialog = toggleDialog;

	}//end of pswdialog focus

// End jQuery(document).ready
});





