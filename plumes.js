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
        _template = '',
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
      if(!_template) {
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
(function() {
  'use strict';

  var List = function(plumes, app, page, component, $list) {

    window.Plumes.Component.call(this);

    var _this = this,
        _components = [],
        _itemTemplate = '',
        _bindingParent = [],
        _bindingKey = null,
        _bindingItem = null,
        _bindingConverter = null,
        _list = [],
        _virtualization = $list.attr('virtualization');

    _virtualization = _virtualization ? $.extend(true, {
      itemHeight: 1
    }, $.parseJSON(_virtualization)) : null;

    function _compare(a, b) {
      if(typeof a != typeof b) {
        return false;
      }

      if(typeof a != 'object' && a !== b) {
        return false;
      }

      if(typeof a == 'object' && $.param(a) != $.param(b)) {
        return false;
      }

      return true;
    }

    function _applyCollectionParent(key, value) {
      $.each(_components, function() {
        this.collection(key, plumes.extendEverything(value));
      });
    }

    function _bindParent(keys) {
      $.each(keys, function() {
        var key = this;
        if(key != '$index' && key != '$length' && key != _bindingItem) {
          if($.inArray(key, _bindingParent) < 0) {
            _bindingParent.push(key);

            component.bind(key, function(value) {
              _applyCollectionParent(key, value);
            });
          }

          _applyCollectionParent(key, plumes.extendEverything(component.collection(key)));
        }
      });
    }

    function _createMissingComponents(count, callback, args) {
      var component = new plumes.Component(plumes, app, page, null);
      _components.push(component);

      component.template(_itemTemplate);
      component.compile(function() {
        component.link({}, function($dom) {
          $list.append($dom);

          if(_virtualization) {
            $dom.css({
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%'
            });
          }

          _bindParent(component.keysBinded());

          count--;
          if(count < 1) {
            if(callback) {
              callback.apply(_this, args || []);
            }
            return;
          }
          _createMissingComponents(count, callback, args);
        });
      });

    }

    function _deleteComponents(count, callback, args) {
      for(var i = 0; i < count; i++) {
        var component = _components.pop();
        component.destroy();
        $list.children().last().remove();
      }

      if(callback) {
        callback.apply(_this, args || []);
      }
    }

    function _updateListLayout(list, lengthChanged) {
      if(!_virtualization) {
        return;
      }

      var $container = $list.parent(),
          container = $container.get(0),
          y = typeof container.pageYOffset != 'undefined' ? container.pageYOffset : container.scrollTop,
          count = Math.ceil($container.height() / _virtualization.itemHeight) + 1;

      if(list) {
        count = count.length > list.length ? list.length : count;

        if(count > _components.length) {
          return _createMissingComponents(count - _components.length, _updateListLayout, [list, lengthChanged]);
        }
        if(count < _components.length) {
          return _deleteComponents(count - list.length, _updateListLayout, [list, lengthChanged]);
        }
      }

      count = count > _components.length ? _components.length : count;

      var startListIndex = Math.floor(y / _virtualization.itemHeight);

      $list.children().each(function(i) {
        var $child = $(this),
            component = _components[i],
            listIndex = i + startListIndex,
            item = _list[listIndex];

        if(item) {
          if(lengthChanged) {
            component.collection('$length', _list.length);
          }
          if(component.collection('$index') != listIndex) {
            component.collection('$index', listIndex);
          }

          component.collection(_bindingItem, plumes.extendEverything(item));
          $child.css('display', '');
        }
        else {
          $child.css('display', 'none');
        }

        $child.css('top', y + (i * _virtualization.itemHeight) - (y % _virtualization.itemHeight));
      });
    }

    function _updateList(list, lengthChanged) {
      _list = list || [];
      lengthChanged = typeof lengthChanged == 'undefined' ? _list.length != _components.length : lengthChanged;

      if(_virtualization) {
        $list.css('height', _virtualization.itemHeight * _list.length);

        _updateListLayout(_list, lengthChanged);
      }
      else {
        if(_list.length > _components.length) {
          return _createMissingComponents(_list.length - _components.length, _updateList, [_list, lengthChanged]);
        }
        if(_list.length < _components.length) {
          return _deleteComponents(_components.length - _list.length, _updateList, [_list, lengthChanged]);
        }

        $.each(_list, function(i) {
          var component = _components[i];

          if(lengthChanged) {
            component.collection('$length', _list.length);
          }
          if(component.collection('$index') != i) {
            component.collection('$index', i);
          }

          var item = component.collection(_bindingItem);
          if(!_compare(this, item)) {
            component.collection(_bindingItem, plumes.extendEverything(this));
          }
        });
      }
    }

    this.compile = function() {
      var attr = $list.attr('pl-list').split(' in ');

      _bindingItem = attr[0];

      _bindingConverter = attr[1].split(':');
      _bindingKey = _bindingConverter[0];
      _bindingConverter = _bindingConverter.length > 1 ? _bindingConverter[1] : null;

      _itemTemplate = $list
        .html()
        .replace(/({{(.*?)}})/g, '<span pl-html="$2"></span>');
      $list.html('');

      if(_virtualization) {
        var $container = $('<div />');

        $.each($list.get(0).attributes, function(idx, attr) {
          if(attr.nodeName != 'pl-list' && attr.nodeName != 'virtualization') {
            $container.attr(attr.nodeName, attr.nodeValue);
          }
        });

        $list.replaceWith($container);
        $container.append($list);

        $list.css({
          position: 'relative',
          height: 'auto',
          margin: 0,
          padding: 0
        });

        $container.css('overflow', 'auto');
        $container.scroll(_updateListLayout);
      }

      component.registerList(_this);
    };

    this.link = function() {
      component.bind(_bindingKey, function(value) {
        if(_bindingConverter) {
          value = component.convert(_bindingConverter, value || []);
        }

        _updateList(value);
      });

      var value = component.collection(_bindingKey);
      if(_bindingConverter) {
        value = component.convert(_bindingConverter, value || []);
      }

      _updateList(value);
    };

    if(_virtualization) {
      $(window).resize(function() {
        _updateListLayout();
      });
    }

  };

  window.Plumes = window.Plumes || {};
  window.Plumes.List = List;
})();
(function() {
  'use strict';

  var Page = function(plumes, app, $page) {

    var _this = this,
        _name = $page.attr('pl-page'),
        _controllers = [],
        _src = $page.attr('src'),
        _components = [],
        _theme = plumes.theme(),
        _referer = null;

    if(_theme) {
      var themeSrc = $page.attr('src-' + _theme);
      _src = themeSrc ? themeSrc : _src;
    }

    if($page.get(0).tagName.toLowerCase() != 'script' || !_name || !_src) {
      console.error('Error: Page format needs to be SCRIPT node with "pl-page" and "src" attributes.');
      return false;
    }

    plumes.Component.call(this, plumes, app, this, $page);

    this.templateSrc(_src);

    this.name = function() {
      return _name;
    };

    this.controller = function(func) {
      _controllers.push(func);
      _this.controllers(_controllers);
    };

    this.beforeNav = function(page, func) {
      _this.on('nav.nav-' + page, function(args) {
        func.call(this, args.collection, args.callback);
        return true;
      });
    };

    this.registerComponent = function(component) {
      _components.push(component);
    };

    this.referer = function(referer) {
      _referer = referer;
    };

    this.on('linked', function() {
      $.each(_components, function() {
        this.link();
      });
    });

  };

  window.Plumes = window.Plumes || {};
  window.Plumes.Page = Page;
})();
(function() {
  'use strict';

  var App = function(plumes, $app) {

    window.EventsManager.call(this);

    var _this = this,
        _name = $app.attr('plumes') || null,
        _index = $app.attr('index') || null,
        _isReady = false,
        _onReadyFunctions = [],
        _DOMposition = 0,
        _page = null,
        _historyEnabled = $app.attr('history') || null,
        _history = [];

    _historyEnabled = _historyEnabled && _historyEnabled == 'false' ? false : true;

    if(!_name) {
      console.error('Error: App format needs to have "plumes" not empty attribute.');
      return false;
    }

    this.name = function() {
      return _name;
    };

    function _ready() {
      setTimeout(function() {
        for(var i = 0; i < _onReadyFunctions.length; i++) {
          _onReadyFunctions[i]();
        }

        if(_index && _this[_index] && _this[_index].name) {
          return _this.open(_index);
        }
      });
    }

    function _collectPages() {
      $app.find('[pl-page]').each(function() {
        var $this = $(this),
            page = new plumes.Page(plumes, _this, $this);

        if(page) {
          var pageName = page.name();

          if(_this[pageName]) {
            console.error('Error: "' + pageName + '" word reserved for Page name.');
            return;
          }

          _this[pageName] = page;
        }
      });
    }

    function _watchHistory() {
      if(_historyEnabled) {
        plumes.on('hashChanged', function(args) {
          args.hash = parseInt(args.hash || 0, 10);

          var lastHistoryIndex = _history.length ? _history.length - 1 : null,
              hashHistory = _history[args.hash];

          if(lastHistoryIndex != args.hash && hashHistory) {
            while(_history.length > args.hash + 1) {
              _history.pop();
            }

            _this.open(hashHistory.page, $.extend(true, {}, hashHistory.collection), false);
          }
        });
      }
    }

    this.init = function() {
      _collectPages();
      _watchHistory();

      _DOMposition = $app.children().length;
      _ready();
    };

    this.ready = function(func) {
      if(_isReady) {
        func.call(this);
        return;
      }

      _onReadyFunctions.push(func);
    };

    function _clearDOM() {
      $app.children().each(function(i) {
        if(i >= _DOMposition) {
          $(this).remove();
        }
      });
    }

    this.open = function(pageName, collection, updateHistory, callback) {
      collection = collection || {};
      updateHistory = typeof updateHistory == 'undefined' ? true : updateHistory;

      if(!_this[pageName] || !_this[pageName].name) {
        console.error('Error: "' + pageName + '" is not a page of ' + _name + '.');
        return false;
      }

      var previousPage = _page ? _page : null;

      _page = pageName;

      var page = _this[_page];

      page.compile(function() {
        page.referer(previousPage, collection);

        if(_historyEnabled && updateHistory) {
          _history.push({
            page: _page,
            collection: $.extend(true, {}, collection)
          });

          window.location.hash = _history.length === 1 ? '' : _history.length - 1;
        }

        page.link(collection, function($dom) {
          if(previousPage) {
            _this[previousPage].destroy();
          }
          _clearDOM();
          $app.append($dom);

          _collectPages();

          if(callback) {
            callback();
          }
        });
      });
    };

    this.pageActive = function() {
      return _page;
    };

  };

  window.Plumes = window.Plumes || {};
  window.Plumes.App = App;
})();
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
        _uid = 0,
        _lastHash = null;

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

    function _watchHash() {
      var hash = location.href.replace( /^[^#]*#?(.*)$/, '$1');
      if(hash !== _lastHash) {
        _this.fire('hashChanged', {
          oldHash: _lastHash,
          hash: hash
        });
        _lastHash = hash;
      }

      setTimeout(_watchHash, 50);
    }

    this.init = function() {
      _watchHash();

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