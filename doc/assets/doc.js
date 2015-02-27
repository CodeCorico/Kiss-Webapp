$(function() {
  'use strict';

  var $window = $(window),
      $body = $('body'),
      $nav = $('.navbar'),
      navOffsetTop = $nav.offset().top;

  $window.resize(function() {
    navOffsetTop = $nav.offset().top;
  });

  $window.on('scroll', function() {
    if(navOffsetTop < $window.scrollTop() && !$body.hasClass('has-docked-nav')) {
      $body.addClass('has-docked-nav');
    }
    if(navOffsetTop > $window.scrollTop() && $body.hasClass('has-docked-nav')) {
      $body.removeClass('has-docked-nav');
    }
  });
});

