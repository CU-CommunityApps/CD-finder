/* !! CUSTOMIZED for Data Storage Tool (ama39, 10/18/17) */

/* CWD Scrolling Tables (ama39, last update: 10/18/17)
   -

   - Accessibility Notes:
   - --

   - Future Plans:
   - --
   ------------------------------------------------------------------------- */

// defaults (Not Yet Implemented)
var max_height = 'auto'; // Sets a maximum height for the table. If table data extends beyond this height, the table will scroll vertically, independently of the page.
var cell_width = 200; // Sets a minimum width (in pixels) to be reserved for each table cell.
var sticky_col = true; // If a table scrolls vertically, its header row will "stick" to the top as data cells slide underneath.
var sticky_row = true; // If a table scrolls horizontally, its header column will "stick" to the left as data cells slide underneath.

// globals
var table_count = 0;
/* !! CUSTOMIZED for Data Storage Tool (ama39, 10/18/17) */

/* CWD Scrolling Tables (ama39, last update: 10/18/17)
   -

   - Accessibility Notes:
   - --

   - Future Plans:
   - --
   ------------------------------------------------------------------------- */

// defaults (Not Yet Implemented)
var max_height = 'auto'; // Sets a maximum height for the table. If table data extends beyond this height, the table will scroll vertically, independently of the page.
var cell_width = 200; // Sets a minimum width (in pixels) to be reserved for each table cell.
var sticky_col = true; // If a table scrolls vertically, its header row will "stick" to the top as data cells slide underneath.
var sticky_row = true; // If a table scrolls horizontally, its header column will "stick" to the left as data cells slide underneath.

// globals
var table_count = 0;


jQuery(document).ready(function($) {

  function tables(refresh) {
    // refresh mode
    var refresh = false || refresh;

    // Set-up markup
    $('table.scrolling').each(function() {

      // add wrappers
      if ( !refresh ) {
        table_count++;
        $(this).wrap('<div class="cwd-scrolling-table"><div class="scrolling-outer"></div></div>');
        $('#container34').show(); // needed for height calculations
      }

      var table_wrapper = $(this).parents('.cwd-scrolling-table').first();

      if ( refresh ) {
        $(table_wrapper).find('.floating-col-header').remove();
      }

      // append floating headers
      if ( !refresh ) {
        $(table_wrapper).append('<div class="floating-row-header" aria-hidden="true"></div>');
      }
      $(table_wrapper).find('.scrolling-outer').first().append('<div class="floating-col-header" aria-hidden="true"></div>')
      //$(table_wrapper).children('.scrolling-outer').css('max-height','220px');

      // clone headers
      var col_headers = $(table_wrapper).find('.floating-col-header').first();
      var row_headers = $(table_wrapper).children('.floating-row-header').first();

      $(row_headers).css('top',$(this).find('thead').outerHeight()+'px');
      $(this).find('tbody th').each(function(i) {
        if ( !refresh ) {
          $(row_headers).append('<div>'+$(this).html()+'</div>');
        }
        $(row_headers).children().eq(i).outerHeight($(this).outerHeight()).css({
          'padding-top': $(this).css('padding-top'),
          'padding-right': $(this).css('padding-right'),
          'padding-bottom': $(this).css('padding-bottom'),
          'padding-left': $(this).css('padding-left'),
          'line-height': $(this).css('line-height')
        });
      });
      $(this).find('thead th, thead td').each(function(i) {
        $(col_headers).append('<div>'+$(this).html()+'</div>');
        $(col_headers).children().eq(i).outerWidth($(this).outerWidth()).css({
          'padding-top': $(this).css('padding-top'),
          'padding-right': $(this).css('padding-right'),
          'padding-bottom': $(this).css('padding-bottom'),
          'padding-left': $(this).css('padding-left'),
          'line-height': $(this).css('line-height'),
          'min-width': $(this).outerWidth(),
          'display': $(this).css('display')
        });
      });

      if ($(this).find('thead th:visible, thead td:visible').length <= 1) {
        $(col_headers).hide();
        $(row_headers).hide();
      }
      else {
        $(col_headers).show();
        $(row_headers).show();
      }

      if ( refresh ) {
        $(col_headers).addClass('scroll-active');
      }

      // scroll events
      //if ( !refresh ) {
        $(window).scroll($.debounce( 0, true, function(){
          $(col_headers).addClass('scroll-active');
        }));
        $(window).scroll($.debounce( 300, function(){
          $(col_headers).css('top','0');
          if ($(col_headers).offset()) {
            if ($(window).scrollTop() >= $(col_headers).offset().top + $(col_headers).height()) {
              $(col_headers).css('top',($(window).scrollTop() - $(col_headers).offset().top)+'px').removeClass('scroll-active');
            }
          }
        }));
      //}

      if ( !refresh ) {
        $('#container34').hide();
      }

      // TODO: add options via data attributes ---------- >
      /* e.g.,
      if ( !$(this).attr('data-cell-width') ) {

      }
      */

    });

  }

  /* Data Storage Tool: Delay table init until the table is rendered by app.js */
  //nst37 - Commented this code in order to make the table rows align when coming in from a URL with services as parameters.
  /*
  var tables_ran_once = false;
  $('#comparisonchart').on('DOMSubtreeModified', function(){
    if (!tables_ran_once) {
      tables();
      tables_ran_once = true;
    }
  });
  */

  tables(true);

  $(document).on('change', '.cardcheckbox, .manualcheckbox, .facet', $.debounce( 50, function(){
    tables(true);
  }));

  $(document).on('click', '.chart-select-all, .chart-select-none, .btn-select-all, .btn-select-none, .btn-clear-filters', $.debounce( 50, function(){
    tables(true);
  }));

  $(window).resize($.debounce( 50, function(){
    tables(true);
  }));


});



jQuery(document).ready(function($) {

  function tables(refresh) {
    // refresh mode
    var refresh = false || refresh;

    // Set-up markup
    $('table.scrolling').each(function() {

      // add wrappers
      if ( !refresh ) {
        table_count++;
        $(this).wrap('<div class="cwd-scrolling-table"><div class="scrolling-outer"></div></div>');
        $('#container34').show(); // needed for height calculations
      }

      var table_wrapper = $(this).parents('.cwd-scrolling-table').first();

      if ( refresh ) {
        $(table_wrapper).find('.floating-col-header').remove();
      }

      // append floating headers
      if ( !refresh ) {
        $(table_wrapper).append('<div class="floating-row-header" aria-hidden="true"></div>');
      }
      $(table_wrapper).find('.scrolling-outer').first().append('<div class="floating-col-header" aria-hidden="true"></div>')
      //$(table_wrapper).children('.scrolling-outer').css('max-height','220px');

      // clone headers
      var col_headers = $(table_wrapper).find('.floating-col-header').first();
      var row_headers = $(table_wrapper).children('.floating-row-header').first();

      $(row_headers).css('top',$(this).find('thead').outerHeight()+'px');
      $(this).find('tbody th').each(function(i) {
        if ( !refresh ) {
          $(row_headers).append('<div>'+$(this).html()+'</div>');
        }
        $(row_headers).children().eq(i).outerHeight($(this).outerHeight()).css({
          'padding-top': $(this).css('padding-top'),
          'padding-right': $(this).css('padding-right'),
          'padding-bottom': $(this).css('padding-bottom'),
          'padding-left': $(this).css('padding-left'),
          'line-height': $(this).css('line-height')
        });
      });
      $(this).find('thead th, thead td').each(function(i) {
        $(col_headers).append('<div>'+$(this).html()+'</div>');
        $(col_headers).children().eq(i).outerWidth($(this).outerWidth()).css({
          'padding-top': $(this).css('padding-top'),
          'padding-right': $(this).css('padding-right'),
          'padding-bottom': $(this).css('padding-bottom'),
          'padding-left': $(this).css('padding-left'),
          'line-height': $(this).css('line-height'),
          'min-width': $(this).outerWidth(),
          'display': $(this).css('display')
        });
      });

      if ($(this).find('thead th:visible, thead td:visible').length <= 1) {
        $(col_headers).hide();
        $(row_headers).hide();
      }
      else {
        $(col_headers).show();
        $(row_headers).show();
      }

      if ( refresh ) {
        $(col_headers).addClass('scroll-active');
      }

      // scroll events
      //if ( !refresh ) {
        $(window).scroll($.debounce( 0, true, function(){
          $(col_headers).addClass('scroll-active');
        }));
        $(window).scroll($.debounce( 300, function(){
          $(col_headers).css('top','0');
          if ($(col_headers).offset()) {
            if ($(window).scrollTop() >= $(col_headers).offset().top + $(col_headers).height()) {
              $(col_headers).css('top',($(window).scrollTop() - $(col_headers).offset().top)+'px').removeClass('scroll-active');
            }
          }
        }));
      //}

      if ( !refresh ) {
        $('#container34').hide();
      }

      // TODO: add options via data attributes ---------- >
      /* e.g.,
      if ( !$(this).attr('data-cell-width') ) {

      }
      */

    });

  }

  /* Data Storage Tool: Delay table init until the table is rendered by app.js */
  //nst37 - Commented this code in order to make the table rows align when coming in from a URL with services as parameters. */

  var tables_ran_once = false;
  $('#comparisonchart').on('DOMSubtreeModified', function(){
    if (!tables_ran_once) {
      tables();
      tables_ran_once = true;
    }
  });

  tables(true);

  $(document).on('change', '.cardcheckbox, .manualcheckbox, .facet', $.debounce( 50, function(){
    tables(true);
  }));

  $(document).on('click', '.chart-select-all, .chart-select-none, .btn-select-all, .btn-select-none, .btn-clear-filters', $.debounce( 50, function(){
    tables(true);
  }));

  $(window).resize($.debounce( 50, function(){
    tables(true);
  }));


});

