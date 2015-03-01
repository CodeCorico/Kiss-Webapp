(function() {
  'use strict';

  var Component = function(plumes, app, page) {

    var _dom = null;

    this.compile = function(callback) {

    };

    this.dom = function() {
      return _dom;
    };

  };

  window.Plumes = window.Plumes || {};
  window.Plumes.Component = Component;
})();