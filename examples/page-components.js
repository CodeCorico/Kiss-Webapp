window.Plumes.ready(function() {
  'use strict';

  this.component('robot', function(next) {

    this.el.robot.css('border-color', this.collection('index') === 1 ? 'red' : 'green');

    this.bind('robot.name', function(value) {
      if(value) {
        this.collection('img', 'http://cyborg.namedecoder.com/webimages/edox-' + value.toUpperCase() + '.png');
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

      this.page().collection('robot' + this.collection('index'), value);
    });

    next();
  });

  this.appComponents.pageComponents.controller(function(next) {

    this.collection('index1', 1);
    this.collection('index2', 2);

    next();
  });

});