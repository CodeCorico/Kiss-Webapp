window.Plumes.ready(function() {
  'use strict';

  this.converter('upper', function(value) {
    return (value + '').toUpperCase();
  });

  this.controlApp.pageControl.controller(function(next) {

    this.bind('robot.name', function(value) {
      if(value) {
        this.collection('img', 'http://cyborg.namedecoder.com/webimages/edox-' + value + '.png');
        this.el.avatar.css({
          height: '',
          background: ''
        });
      }
      else {
        this.collection('img', '');
        this.el.avatar.css({
          height: '30px',
          background: 'red'
        });
      }
    });

    this.collection('robot', {
      name: 'Xavier'
    });

    next();
  });

});