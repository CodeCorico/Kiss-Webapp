(function() {
  'use strict';

  $.extend($.expr[':'], {
    attrStartsWith: function (el, _, b) {
      for (var i = 0, atts = el.attributes, n = atts.length; i < n; i++) {
        if(atts[i].nodeName.indexOf(b[3]) === 0) {
          return true;
        }
      }

      return false;
    }
  });

  var Component = function(plumes, app, page, $component) {

    window.EventsManager.call(this);

    var COLLECTION_PRE = 'collection-',

        _this = this,
        _name = null,
        _collection = null,
        _template = null,
        _templateSrc = null,
        _controllers = null,
        _converters = {},
        _lists = [],
        _keysBinded = [];

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

    this.template = function(template) {
      if(typeof template != 'undefined') {
        _template = template;
      }

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

    this.keysBinded = function() {
      return _keysBinded;
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

    function _findCollectionInherits(element, eachFunc) {
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

    function _findInScope(selector, includeComponent) {
      var $selection;

      if($component.attr('pl-component')) {
        $selection = $component.find(selector).not('[pl-component] [pl-component] ' + selector);
      }
      else {
        $selection = $component.find(selector).not('[pl-component] ' + selector);
      }

      if(includeComponent && $component.is(selector)) {
        $selection = $selection.add($component);
      }

      return $selection;
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
      var key = name.split('.')[0];
      if($.inArray(key, _keysBinded) < 0) {
        _keysBinded .push(key);
      }

      name = name.replace(/\./g, '/');

      _this.on('collection.' + COLLECTION_PRE + name, function(args) {
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

    function _compileLists($subcomponents) {
      $subcomponents.each(function() {
        var $this = $(this);

        new plumes.List(plumes, app, page, _this, $this)
          .compile();
      });
    }

    function _linkLists() {
      $.each(_lists, function() {
        this.link();
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
      if(_template === null) {
        _templateSrc = _templateSrc ? _templateSrc : $component.attr('pl-component-src');
        var theme = plumes.theme();
        if(theme) {
          var themeSrc = $component.attr('pl-component-src-' + theme);
          _templateSrc = themeSrc ? themeSrc : _templateSrc;
        }

        plumes.registerTemplate(_templateSrc, function(template) {
          _template = template;
          _this.compile(callback);
        });

        return _this;
      }

      if($component && $component.attr('pl-component-src')) {
        var inherits = [];

        _findCollectionInherits($component, function() {
          inherits.push(this);
        });

        $component.html(_template);
        var $insideComponent = $component.find('[pl-component]');
        $component.replaceWith($insideComponent);
        $component = $insideComponent;
        _name = $component.attr('pl-component');

        $.each(inherits, function() {
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

      _compileLists($component.find('[pl-list]'));

      _compileSubcomponents($component.find('[pl-component-src]'), function() {
        if(callback) {
          callback();
        }
      });

      return _this;
    };

    function _bindAttribute(key) {
      key = (key + ':').split(':');

      return {
        key: key[0],
        converter: key.length > 1 ? key[1] : null
      };
    }

    this.link = function(collection, callback) {
      _collection = collection || {};

      if($component.attr('pl-component')) {
        _findCollectionInherits($component, function() {
          var attr = this;

          page.bind(attr.value, function(value) {
            _this.collection(attr.name, value);
          });

          _this.collection(attr.name, page.collection(attr.value));
        });
      }

      _findInScope(':attrStartsWith("pl-attr-")', true).each(function() {
        var $this = $(this),
            find = 'pl-attr-',
            attrName = false,
            attr = false;

        $.each(this.attributes, function() {
          if(this.specified && this.name.length > find.length && this.name.indexOf(find) === 0) {
            attrName = this.name.substr(find.length, this.name.length - find.length);
            attr = _bindAttribute(this.value);
          }
        });

        if(attrName && attr) {
          _this.bind(attr.key, function(value) {
            if(attr.converter) {
              value = _this.convert(attr.converter, value);
            }

            $this.attr(attrName, value);
          });
        }
      });

      _findInScope('[pl-html]').each(function() {
        var $this = $(this),
            attr = _bindAttribute($this.attr('pl-html'));

        _this.bind(attr.key, function(value) {
          if(attr.converter) {
            value = _this.convert(attr.converter, value);
          }

          $this.html(value + '');
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

        _findCollectionInherits(this, function() {
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
            attr = _bindAttribute($this.attr('pl-bind')),
            type = ($this.attr('type') || '').toLowerCase(),
            tagName = $this.get(0).tagName.toLowerCase();

        if(tagName == 'button' || (tagName == 'input' && (type == 'button' || type == 'submit'))) {
          $this.bind('click', function() {
            _this.collection(attr.key, (_this.collection(attr.key) || 0) + 1);
          });
        }
        else if(tagName == 'input' || tagName == 'textarea') {
          _this.bind(attr.key, function(value) {
            if(attr.converter) {
              value = _this.convert(attr.converter, value);
            }

            $this.val(value + '');
          });

          $this.bind('propertychange change click keyup input paste', function() {
            _this.collection(attr.key, $this.val());
          });
        }
        else if(tagName == 'form') {
          $this.submit(function(event) {
            event.preventDefault();
            _this.collection(attr.key, (_this.collection(attr.key) || 0) + 1);
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

          _linkLists();

          _this.fire('linked');

          if(callback) {
            callback($component);
          }
        });
      }

      _linkLists();

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

    this.converter = function(name, func) {
      _converters[name] = _converters[name] || null;

      if(typeof func == 'function') {
        _converters[name] = func;
      }

      return _converters[name];
    };

    this.convert = function(name, value) {
      var converter = _this.converter(name);

      if(!converter && $component.attr('pl-component')) {
        converter = page.converter(name);
      }
      if(!converter) {
        converter = plumes.converter(name);
      }

      if(converter) {
         return converter.call(this, value);
      }

      return value;
    };

    this.registerList = function(list) {
      _lists.push(list);
    };

  };

  window.Plumes = window.Plumes || {};
  window.Plumes.Component = Component;
})();