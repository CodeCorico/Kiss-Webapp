(function() {
  'use strict';

  var Plumes = function() {

    window.EventsManager.call(this);

    var _this = this,
        _isReady = false,
        _appsReady = 0,
        _appsCount = 0,
        _onReadyFunctions = [],
        _components = {};

    function _ready(force) {
      force = force || false;
      _appsReady++;

      if(force || _appsReady >= _appsCount) {
        _isReady = true;

        for(var i = 0; i < _onReadyFunctions.length; i++) {
          _onReadyFunctions[i].call(_this);
        }
      }
    }

    this.extendEverything = function(anyType) {
      if(typeof anyType != 'undefined') {
        if($.isPlainObject(anyType) && anyType) {
          return $.extend(true, {}, anyType);
        }
        else if($.isArray(anyType)) {
          return $.extend(true, [], anyType);
        }
      }

      return anyType;
    };

    this.init = function() {
      $('[plumes]').each(function() {
        var app = new _this.App(_this, $(this));
        if(app) {
          var appName = app.name();

          if(_this[appName]) {
            console.error('Error: "' + appName + '" word reserved for App name.');
            return;
          }

          app.ready(function() {
            _ready();
          });

          _this[appName] = app;
          _appsCount++;
          app.init();
        }
      });
    };

    this.ready = function(func) {
      if(_isReady) {
        func.call(_this);
        return;
      }

      _onReadyFunctions.push(func);
    };

    this.component = function($component, callback) {
      var src = $component.attr('pl-component');

      $component
        .removeAttr('pl-component')
        .attr('pl-comp', src);

      if(_components[src]) {
        $component.html(_components[src]);

        if(callback) {
          callback();
        }

        return;
      }

      $component.load(src, function() {
        _components[src] = $component.html();

        if(callback) {
          callback();
        }
      });
    };
  };

  var plumes = new Plumes();

  if(window.Plumes) {
    var feature;
    for(feature in window.Plumes) {
      plumes[feature] = window.Plumes[feature];
    }
  }

  window.Plumes = plumes;
})();

$(function() {
  'use strict';

  window.Plumes.init();
});