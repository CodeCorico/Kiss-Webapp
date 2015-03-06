window.Plumes.ready(function() {
  'use strict';

  this.converter('upper', function(list) {
    $.each(list, function() {
      this.text = this.text.toUpperCase();
    });

    return list;
  });

  this.converter('odd', function(index) {
    return index % 2 ? 'blue' : 'green';
  });

  this.appList.pageList.controller(function(next) {

    this.bind('addForm', function() {
      var newRobot = this.collection('newRobot');
      if(newRobot) {
        var robots = this.collection('robots').map(function(robot) {
          return robot;
        });
        robots.push({
          text: newRobot
        });
        this.collection('robots', robots);
        this.el.newRobotInput.val('');
      }
    });

    this.collection('robots', [{
      text: 'Xavier'
    }, {
      text: 'Guillaume'
    }]);

    this.collection('type', 'robot');

    next();
  });

});