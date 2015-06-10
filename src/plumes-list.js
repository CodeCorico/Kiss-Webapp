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
            $container.attr(attr.nodeName, attr.value);
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