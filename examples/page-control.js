window.Plumes.ready(function() {
  'use strict';

  this.controlApp.pageControl.controller(function(next) {

    this.bind('user.name', function(value) {
      if(value) {
        this.collection('img', 'http://cyborg.namedecoder.com/webimages/edox-' + value.toUpperCase() + '.png');
      }
      else {
        this.collection('img', '');
        this.el.robot.css({
          height: '30px',
          background: 'red'
        });
      }
    });

    this.collection('user', {
      name: 'Xavier'
    });

    next();
  });

});