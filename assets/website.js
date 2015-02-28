$(function() {
  'use strict';

  var $window = $(window),
      $body = $('body'),
      $codeSnippets = $('.code-example-body'),
      $nav = $('.navbar'),
      navOffsetTop = $nav.offset().top,
      entityMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        '\'': '&#39;',
        '/': '&#x2F;'
      };

  function _escapeHtml(string) {
    return string.replace(/[&<>"'\/]/g, function (s) {
      return entityMap[s];
    });
  }

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

  $codeSnippets.each(function() {
    var newContent = _escapeHtml($(this).html());
    $(this).html(newContent);
  });

});

