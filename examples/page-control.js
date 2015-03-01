window.Plumes.ready(function() {
  'use strict';

  this.controlApp.pageControl.controller(function(next) {

    this.bind('shapes.color', function(value) {
      this.el.square.css('background', value);
    });

    this.collection('shapes', {
      color: 'green'
    });

    next();
  });

});