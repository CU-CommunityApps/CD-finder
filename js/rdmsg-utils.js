var Drupal = Drupal || {};

(function($, Drupal){
  "use strict";

  // Navigation selected main navigation hightlighted

      var loc = window.location.href; // returns the full URL

      $('.front #home').addClass('active');
      $('.not-front #home').removeClass('active');

      if(/about/.test(loc)) {

        $('#about').addClass('active');
      }

      if(/services/.test(loc)) {

        $('#services').addClass('active');
      }

      if(/data-management-planning/.test(loc)) {

        $('#data-management-planning').addClass('active');
      }

      if(/best-practices/.test(loc)) {

        $('#best-practices').addClass('active');
      }



      // Navigation selected footer navigation hightlighted

      $('.front #home').addClass('active-footer');
      $('.not-front #home').removeClass('active-footer');

      if(/calendar/.test(loc)) {

        $('#calendar').addClass('active-footer');
      }

      if(/mailing-list/.test(loc)) {

        $('#mailing-list').addClass('active-footer');
      }

      if(/privacy/.test(loc)) {

        $('#privacy').addClass('active-footer');
      }

      if(/faq/.test(loc)) {

        $('#faq').addClass('active-footer');
      }

      if(/site-index/.test(loc)) {

        $('#site-index').addClass('active-footer');
      }



       $( '.search' ).click(function(e) {

          e.preventDefault();
          $('.search-banner').fadeIn( 400 );
      });

       $( '.close-search-banner' ).click(function(e) {

          e.preventDefault();
          $('.search-banner').fadeOut( 400 );
      });

})(jQuery, Drupal);