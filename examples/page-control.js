window.Plumes.ready(function() {
  'use strict';

  this.controlApp.pageControl.controller(function(next) {

    this.bind('color', function(value) {
      this.el.square.css('background', value);
    });

    this.collection('color', 'green');

    next();
  });

});