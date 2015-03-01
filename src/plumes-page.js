(function() {
  'use strict';

  var Page = function(plumes, app, $page) {

    window.EventsManager.call(this);

    var COLLECTION_PRE = 'collection-',

        _this = this,
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

    function _fromNamespace(obj, namespace, newValue, index) {
      index = index || 0;
      namespace = index === 0 ? namespace.split('.') : namespace;

      if(typeof newValue != 'undefined' && index < namespace.length - 1 && typeof obj[namespace[index]] != 'object') {
        obj[namespace[index]] = {};
      }

      if(typeof obj[namespace[index]] != 'undefined' || typeof newValue != 'undefined') {
        if(index === namespace.length - 1) {
          if(typeof newValue !== 'undefined') {
            var oldValue = obj[namespace[index]];
            obj[namespace[index]] = newValue;
            return {
              namespace: namespace,
              oldValue: oldValue,
              value: obj[namespace[index]]
            };
          }
          return obj[namespace[index]];
        }

        return _fromNamespace(obj[namespace[index]], namespace, newValue, index + 1);
      }

      return;
    }

    this.collection = function(name, value) {
      if(typeof name == 'undefined') {
        return _collection;
      }

      if(typeof value == 'undefined') {
        return _fromNamespace(_collection, name);
      }

      var result = _fromNamespace(_collection, name, value);

      if(result.oldValue != result.value) {
        var namespace = [],
            i;

        for(i = 0; i < result.namespace.length; i++) {
          namespace.push(result.namespace[i]);
          _this.fire(COLLECTION_PRE + namespace.join('/'), {
            value: _fromNamespace(_collection, namespace.join('.'))
          });
        }

        namespace = COLLECTION_PRE + namespace.join('/') + '/';

        var events = _this.eventsName();
        for(i = 0; i < events.length; i++) {
          var event = events[i];
          if(event.length > namespace.length && event.indexOf(namespace) === 0) {
            var eventNamespace = event
              .substr(COLLECTION_PRE.length, event.length - COLLECTION_PRE.length)
              .replace(/\//g, '.');

            _this.fire(event, {
              value: _fromNamespace(_collection, eventNamespace)
            });
          }
        }

      }

      return this;
    };

    this.bind = function(name, func) {
      _this.on('collection.' + COLLECTION_PRE + name.replace(/\./g, '/'), function(args) {
        func.call(_this, args.value);
      });

      return _this;
    };

    this.beforeNav = function(page, func) {
      _this.on('nav.nav-' + page, function(args) {
        func.call(this, _this.collection(), args.callback);
        return true;
      });
    };

    function _ready() {
      _isReady = true;

      for(var i = 0; i < _onReadyFunctions.length; i++) {
        _onReadyFunctions[i]();
      }
    }

    this.ready = function(func) {
      if(_isReady) {
        func.call(_this);
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

    function _openPage(name, collection, onlyProperties) {
      onlyProperties = onlyProperties || {};

      var sendCollection = {};
      $.each(onlyProperties, function() {
        if(typeof collection[this.from] != 'undefined') {
          sendCollection[this.to] = plumes.extendEverything(collection[this.from]);
        }
      });

      app.open(name, sendCollection);
    }

    this.createDOM = function(dom, collection, callback) {
      _this.clear();
      _$dom = $(dom);
      _collection = collection;

      _$dom.find('[pl-binded]').each(function() {
        var $this = $(this),
            name = $this.attr('pl-binded');

        _this.bind(name, function(value) {
          $this.html(value + '');
        });
      });

      _$dom.find('[pl-element]').each(function() {
        var $this = $(this),
            name = $this.attr('pl-element');

        _this.el[name] = $this;
      });

      _$dom.find('[pl-nav-page]').each(function() {
        var $this = $(this),
            name = $this.attr('pl-nav-page'),
            onlyProperties = [],
            find = 'pl-collection-';

        $.each(this.attributes, function() {
          if(this.specified && this.name.length > find.length && this.name.indexOf(find) === 0) {
            onlyProperties.push({
              from: this.value,
              to: this.name.substr(find.length, this.name.length - find.length)
            });
          }
        });

        $this.click(function() {
          var returns = 0,
              howMany = _this.fire('nav-' + name, {
                callback: function(collection) {
                  setTimeout(function() {
                    returns++;
                    if(returns >= howMany) {
                      _openPage(name, collection, onlyProperties);
                    }
                  });
                }
              }).length;

          if(!howMany) {
            _openPage(name, _this.collection(), onlyProperties);
          }
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

      $.each(_collection, function(name, value) {
        _this.collection(name, plumes.extendEverything(value));
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
      _this.removeEventsNamespace('nav');
      _this.el = {};

      return _this;
    };

    this.destroy = function(func) {
      if(func) {
        _this.on('destroy', function() {
          func.call(_this);
        });
        return _this;
      }

      _this.fire('destroy');
      _this.clear();

      return _this;
    };

    this.DOM = function() {
      return _$dom;
    };

  };

  window.Plumes = window.Plumes || {};
  window.Plumes.Page = Page;
})();