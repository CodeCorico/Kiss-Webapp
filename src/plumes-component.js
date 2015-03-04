(function() {
  'use strict';

  var Component = function(plumes, app, page, $component) {

    window.EventsManager.call(this);

    var COLLECTION_PRE = 'collection-',

        _this = this,
        _name = null,
        _collection = null,
        _template = '',
        _templateSrc = null,
        _controllers = null;

    this.el = {};

    this.name = function() {
      return _name;
    };

    this.app = function() {
      return app;
    };

    this.page = function() {
      return page;
    };

    this.template = function() {
      return _template;
    };

    this.templateSrc = function(templateSrc) {
      if(typeof templateSrc != 'undefined') {
        _templateSrc = templateSrc;
      }

      return _templateSrc;
    };

    this.controllers = function(controllers) {
      if(typeof controllers != 'undefined') {
        _controllers = controllers;
      }

      return _controllers;
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

    function _findCollectionConverters(element, eachFunc) {
      element = element.jquery ? element.get(0) : element;

      var find = 'pl-collection-';

      $.each(element.attributes, function() {
        if(this.specified && this.name.length > find.length && this.name.indexOf(find) === 0) {
          eachFunc.call({
            name: this.name.substr(find.length, this.name.length - find.length),
            value: this.value
          });
        }
      });
    }

    function _findInScope(selector) {
      if($component.attr('pl-component')) {
        return $component.find(selector).not('[pl-component] [pl-component] ' + selector);
      }
      return $component.find(selector).not('[pl-component] ' + selector);
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

    function _callControllers(controllers, i, callback) {
      controllers[i].call(_this, function() {
        if(i < controllers.length - 1) {
          return _callControllers(controllers, ++i, callback);
        }
        if(callback) {
          callback();
        }
      });
    }

    function _compileSubcomponents($subcomponents, callback, index) {
      index = index || 0;
      if(index < $subcomponents.length) {
        new plumes.Component(plumes, app, page, $($subcomponents.get(index)))
          .compile(function() {
            _compileSubcomponents($subcomponents, callback, ++index);
          });

        return;
      }

      if(callback) {
        callback();
      }
    }

    this.compile = function(callback) {
      if(!_template) {
        _templateSrc = _templateSrc ? _templateSrc : $component.attr('pl-component-src');

        plumes.registerTemplate(_templateSrc, function(template) {
          _template = template;
          _this.compile(callback);
        });

        return _this;
      }

      if($component.attr('pl-component-src')) {
        var converters = [];

        _findCollectionConverters($component, function() {
          converters.push(this);
        });

        $component.html(_template);
        var $insideComponent = $component.find('[pl-component]');
        $component.replaceWith($insideComponent);
        $component = $insideComponent;
        _name = $component.attr('pl-component');

        $.each(converters, function() {
          $component.attr('pl-collection-' + this.name, this.value);
        });

        page.registerComponent(_this);
      }
      else {
        $component = $($('<div />')
          .html(_template)
          .children()
          .get(0)
        );
      }

      _compileSubcomponents($component.find('[pl-component-src]'), function() {
        if(callback) {
          callback();
        }
      });

      return _this;
    };

    this.link = function(collection, callback) {
      _collection = collection || {};

      if($component.attr('pl-component')) {
        _findCollectionConverters($component, function() {
          var attr = this;

          page.bind(attr.value, function(value) {
            _this.collection(attr.name, value);
          });

          _this.collection(attr.name, page.collection(attr.value));
        });
      }

      _findInScope('[pl-value]').each(function() {
        var $this = $(this);

        _this.bind($this.attr('pl-value'), function(value) {
          $this.html(value + '');
        });
      });

      _findInScope('[pl-src]').each(function() {
        var $this = $(this);

        _this.bind($this.attr('pl-src'), function(value) {
          $this.attr('src', value + '');
        });
      });

      if(_name) {
        _this.el[_name] = $component;
      }

      _findInScope('[pl-element]').each(function() {
        var $this = $(this),
            name = $this.attr('pl-element');

        _this.el[name] = $this;
      });

      _findInScope('[pl-nav-page]').each(function() {
        var $this = $(this),
            name = $this.attr('pl-nav-page'),
            onlyProperties = [];

        _findCollectionConverters(this, function() {
          onlyProperties.push({
              from: this.value,
              to: this.name
            });
        });

        $this.click(function() {
          var returns = 0,
              howMany = page.fire('nav-' + name, {
                collection: collection,
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

      _findInScope('[pl-bind]').each(function() {
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

      var controllers = _controllers ? _controllers :
        (_name ? plumes.component(_name).controllers : []);

      if(controllers.length) {
        return _callControllers(controllers, 0, function() {
          _this.fire('linked');

          if(callback) {
            callback($component);
          }
        });
      }

      _this.fire('linked');

      if(callback) {
        callback($component);
      }
    };

    this.destroy = function(func) {
      if(func) {
        _this.on('destroy', function() {
          func.call(_this);
        });
        return _this;
      }

      _this.fire('destroy');

      return _this;
    };

    this.dom = function() {
      return $component;
    };

  };

  window.Plumes = window.Plumes || {};
  window.Plumes.Component = Component;
})();