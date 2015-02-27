(function() {
  'use strict';

  var Page = function(plumes, app, $page) {

    window.EventsManager.call(this);

    var _this = this,
        _isReady = false,
        _onReadyFunctions = [],
        _name = $page.attr('pl-page'),
        _src = $page.attr('src'),
        _template = '',
        _compile = null,
        _$dom = null,
        _controllers = [],
        _collection = null,
        _elements = null;

    if($page.get(0).tagName.toLowerCase() != 'script' || !_name || !_src) {
      console.error('Error: Page format needs to be SCRIPT node with "pl-page" and "src" attributes.');
      return false;
    }

    this.el = {};

    this.name = function() {
      return _name;
    };

    this.src = function() {
      return _src;
    };

    this.collection = function(name, value) {
      if(typeof name == 'undefined') {
        return _collection;
      }

      if(typeof value == 'undefined') {
        return _collection[name];
      }

      var oldValue = _collection[name];
      if(oldValue != value) {
        _collection[name] = value;

        _this.fire(name + 'Changed', {
          value: value,
          oldValue: oldValue
        });
      }

      return this;
    };

    this.bind = function(name, func) {
      _this.on('collection.' + name + 'Changed', function(args) {
        func(args.value, args.oldValue);
      });

      return _this;
    };

    function _ready() {
      _isReady = true;

      for(var i = 0; i < _onReadyFunctions.length; i++) {
        _onReadyFunctions[i]();
      }
    }

    this.ready = function(func) {
      if(_isReady) {
        func();
        return;
      }

      _onReadyFunctions.push(func);
    };

    this.init = function() {
      $page.load(_src, function() {
        _template = $page.html();
        $page.html('');
        _ready();
      });
    };

    this.template = function() {
      return _template;
    };

    this.controller = function(func) {
      _controllers.push(func);
    };

    this.compile = function() {
      if(!_compile) {
        _compile = _template.replace(/({{(.*?)}})/g, '<span pl-binded="$2"></span>');
      }

      return _compile;
    };

    function _callControllers(i, callback) {
      _controllers[i].call(_this, function() {
        if(i < _controllers.length - 1) {
          return _callControllers(++i, callback);
        }
        if(callback) {
          callback();
        }
      });
    }

    this.createDOM = function(dom, callback) {
      _this.clear();
      _$dom = $(dom);

      _$dom.find('[pl-binded]').each(function() {
        var $this = $(this),
            name = $this.attr('pl-binded');

        _this.bind(name, function(value) {
          $this.html(value);
        });
      });

      _$dom.find('[pl-element]').each(function() {
        var $this = $(this),
            name = $this.attr('pl-element');

        _this.el[name] = $this;
      });

      _$dom.find('[pl-nav-page]').each(function() {
        var $this = $(this),
            name = $this.attr('pl-nav-page');

        $this.click(function() {
          app.open(name);
        });
      });

      _$dom.find('[pl-bind]').each(function() {
        var $this = $(this),
            name = $this.attr('pl-bind'),
            type = ($this.attr('type') || '').toLowerCase(),
            tagName = $this.get(0).tagName.toLowerCase();

        if(tagName == 'button' || (tagName == 'input' && (type == 'button' || type == 'submit'))) {
          $this.bind('click', function() {
            _this.collection(name, (_this.collection(name) || 0) + 1);
          });
        }
        else if(tagName == 'input' || tagName == 'textarea') {
          _this.bind(name, function(value) {
            $this.val(value);
          });

          $this.bind('propertychange change click keyup input paste', function() {
            _this.collection(name, $this.val());
          });
        }
        else if(tagName == 'form') {
          $this.submit(function(event) {
            event.preventDefault();
            _this.collection(name, (_this.collection(name) || 0) + 1);
          });
        }
      });

      if(_controllers.length) {
        return _callControllers(0, callback);
      }

      if(callback) {
        callback();
      }
    };

    this.clear = function() {
      _$dom = null;
      _collection = {};
      _elements = {};
      _this.removeEventsNamespace('collection');
      _this.el = {};

      return _this;
    };

    this.DOM = function() {
      return _$dom;
    };

  };

  window.Plumes = window.Plumes || {};
  window.Plumes.Page = Page;
})();