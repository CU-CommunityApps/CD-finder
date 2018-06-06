/* CWD Image Gallery (ama39, last update: 8/10/17)
   - Supports two interface modes:
   - 1. Thumbnail Grid with Modal ("Grid mode") - a collection of clickable thumbnails which launch full-sized images in a modal popup (requires cwd_popups.js)
   - -- Grid mode doesn't technically require this JavaScript file (all functionality is handled by the "gallery" scripting in cwd_popups.js).
   - -- However, a quick check is performed below that will ensure that any missing attributes are added (which is helpful in Drupal, for example, where the markup is being generated dynamically)
   - 2. Viewer with Thumbnails ("Viewer mode") - an inline slide viewer with scrolling thumbnail strip
   -
   - Set up and activate a gallery by including the "cwd-gallery" class on its container and following the markup guide in the "Scripted Components" documentation.
   - Include the "viewer" class to activate Viewer mode or the "grid" class for Grid mode.
   
   - Accessibility Notes:
   - -- The Image Gallery is keyboard and screen reader accessible, allowing users to browse gallery content with minimal UI-manipulation.
   - -- Be sure to follow the markup guide in the "Scripted Components" documentation carefully and include alt text as well as captions if applicable.
   - -- Note that links do not have "aria-haspopup" set to true, and have an unusual role of "img" applied. This is part of the accessibility strategy. See the documentation for more details. 
   - -- Also see "cwd_popups.js" for accessibility information related to the modal popup.
   
   - Future Plans:
   - -- Smarter preloading (maybe asynchronous preloading that loads images when their thumbnail is visible on screen instead of all images at once?)
   ------------------------------------------------------------------------- */
	
// defaults
var slide_ratio = 0.667; // ratio of height to width (height is ~67% of width)

// globals
var gallery_count = 0;

		
jQuery(document).ready(function($) {	
	
	// Thumbnail Grid with Modal
	$('.cwd-gallery.grid').each(function() {
		gallery_count++;
		// add .popup class to thumbnails if missing
		$(this).find('.thumbnails a').addClass('popup');
		// add a data-gallery attribute if missing
		$(this).find('.thumbnails a').each(function() {
			if ( !$(this).attr('data-gallery') ) {
				$(this).attr('data-gallery','image-gallery-'+gallery_count);
			}
		});
	});
	
	// Viewer with Thumbnails
	$('.cwd-gallery.viewer').each(function() {
		
		var gallery = $(this);
		var slide = $(this).find('.slide');
		var thumbnails = $(this).find('.thumbnails');
		var image_count = $(this).find('.thumbnails .col').length;
		$(slide).append('<p class="caption"></p><div class="gallery-nav"><div class="next-prev"><a class="prev" href="#"><span class="hidden">Previous Item</span></a><a class="next" href="#"><span class="hidden">Next Item</span></a></div></div>');
		
		// configure thumbnail buttons
		$(this).find('.thumbnails a').click(function(e) {
			e.preventDefault();
			var native_width = parseInt($(this).attr('data-native-width'));
			var native_height = parseInt($(this).attr('data-native-height'));
			
			// detect images that are too tall for the viewer's ratio (e.g., square images, portrait images)
			if (native_height / native_width > slide_ratio) {
				$(slide).addClass('portrait');
			}
			else {
				$(slide).removeClass('portrait');
			}
			
			// display image and caption
			$(slide).attr('style','background-image:url('+$(this).attr('href')+');');
			$(slide).find('.caption').text($(this).attr('data-title'));
			
			// thumbnail states
			$(gallery).find('.thumbnails a').removeClass('active');
			$(this).addClass('active');
			
			// autoscroll the thumbnail band if needed to make the active thumbnail fully visible
			var thumb_position = parseInt($(this).parent().position().left);
			var thumb_width = $(this).width();
			var band_width = $(thumbnails).width();
			var band_scroll = $(thumbnails).scrollLeft();
			var grid_size = $(this).width() + parseInt($(this).parent().css('padding-left')) + parseInt($(this).parent().css('padding-right'));
			
			if ( thumb_position - (grid_size/2) < 0 ) {
				// needs a scroll on the left
				$(thumbnails).stop().animate({
					scrollLeft: band_scroll + thumb_position - (grid_size/2)
				}, 300, 'easeOutQuad');
			}
			else if ( thumb_position + (grid_size*1.5) > band_width ) {
				// needs a scroll on the right
				$(thumbnails).stop().animate({
					scrollLeft: thumb_position + band_scroll + (grid_size*1.5) - band_width
				}, 300, 'easeOutQuad');
			}
			
			// hide the faded edge effect when the first or last thumbnail is active
			if ( $(this).parent(':first-child').length > 0 ) {
				$(gallery).find('.thumbnails-band').addClass('hide-before');
				$(gallery).find('.thumbnails-band').removeClass('hide-after');
			}
			else if ( $(this).parent(':last-child').length > 0 ) {
				$(gallery).find('.thumbnails-band').addClass('hide-after');
				$(gallery).find('.thumbnails-band').removeClass('hide-before');
			}
			else {
				$(gallery).find('.thumbnails-band').removeClass('hide-after hide-before');
			}
			
		}).focus(function() {
			$(this).trigger('click');
		});
		
		// nav buttons (Next and Previous)
		$(slide).find('.next-prev a').click(function(e) {
			e.preventDefault();
			e.stopPropagation();

			var gallery_current_image = $(thumbnails).find('.col .active').parent().index();
			if ($(this).hasClass('prev')) { // left button
				var next_image = gallery_current_image - 1;
				if (next_image < 0) {
					next_image = image_count - 1;
				}
				$(thumbnails).find('.col a').eq(next_image).trigger('click');
			}
			else { // right button
				var next_image = gallery_current_image + 1;
				if (next_image > image_count-1) {
					next_image = 0;
				}
				$(thumbnails).find('.col a').eq(next_image).trigger('click');
			}
		});
		
	});
	
	
	// Window Load ------------------------------------------------------------
	$(window).on("load", function() {
	
		$('.cwd-gallery.viewer').each(function() {
		
			$(this).find('.thumbnails a').each(function(i) {
			
				// preload images
				// TODO: some kind of smarter, asynchronous preloading?
				var img = new Image();
				var button = $(this);
				img.onload = function() {
					$(button).attr('data-native-width',this.width);
					$(button).attr('data-native-height',this.height);
				
					// activate first slide
					if (i == 0) {
						$(button).trigger('click');
					}
				};
				img.src = $(this).attr('href');
			
			});
		});

	});
	
});

