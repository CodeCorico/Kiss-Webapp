window.Plumes.ready(function() {
  'use strict';

  this.loopsApp.pageLoops.controller(function(next) {

    this.bind('addForm', function() {
      var newTask = this.collection('newTask');
      if(newTask) {
        var tasks = this.collection('tasks').map(function(task) {
          return task;
        });
        tasks.push({
          text: newTask
        });
        this.collection('tasks', tasks);
        this.el.newTaskInput.val('');
      }
    });

    this.collection('tasks', [{
      text: 'Buy milk'
    }, {
      text: 'Update my apps'
    }]);

    this.collection('user', {
      name: 'Xavier',
      age: 29
    });

    next();
  });

});