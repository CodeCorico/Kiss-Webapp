(function() {
  'use strict';

  var Plumes = function() {

    window.EventsManager.call(this);

    var _this = this,
        _isReady = false,
        _appsReady = 0,
        _appsCount = 0,
        _onReadyFunctions = [],
        _components = {},
        _componentsTemplate = {},
        _converters = {},
        _theme = null,
        _uid = 0;

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

    this.registerTemplate = function(src, callback) {
      if(_componentsTemplate[src]) {
        if(callback) {
          callback(_componentsTemplate[src]);
        }

        return;
      }

      var $div = $('<div />');

      $div.load(src + '?_t=' + (new Date().getTime()) + (++_uid), function() {
        _componentsTemplate[src] = $div.html()
          .replace(/({{(.*?)}})/g, '<span pl-html="$2"></span>');

        if(callback) {
          callback(_componentsTemplate[src]);
        }
      });
    };

    this.component = function(name, controller) {
      _components[name] = _components[name] || {
        controllers: []
      };

      if(typeof controller == 'function') {
        _components[name].controllers.push(controller);
      }

      return _components[name];
    };

    this.converter = function(name, func) {
      _converters[name] = _converters[name] || null;

      if(typeof func == 'function') {
        _converters[name] = func;
      }

      return _converters[name];
    };

    this.theme = function(theme) {
      if(typeof theme == 'string') {
        _theme = theme;
      }

      return _theme;
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