window.Plumes.ready(function() {
  'use strict';

  this.appListsVirtualization.pageList.controller(function(next) {

    var array = new Array(100000),
        robots = [];
    for(var i = 0; i < array.length; i++) {
      robots.push({
        text: 'Robot ' + i
      });
    }

    this.collection('robots', robots);

    next();
  });

});